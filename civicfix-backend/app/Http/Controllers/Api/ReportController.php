<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\ReportHistory;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'status' => ['nullable', Rule::in(Report::STATUSES)],
            'category' => ['nullable', Rule::in(Report::CATEGORIES)],
            'priority' => ['nullable', Rule::in(Report::PRIORITIES)],
            'search' => ['nullable', 'string', 'max:150'],
        ]);

        $query = Report::with(['user', 'technician'])->latest();

        if ($user->role === User::ROLE_CITIZEN) {
            $query->where('user_id', $user->id);
        }

        if ($user->role === User::ROLE_TECHNICIAN) {
            $query->where('assigned_to', $user->id);
        }

        foreach (['status', 'category', 'priority'] as $filter) {
            if (! empty($data[$filter])) {
                $query->where($filter, $data[$filter]);
            }
        }

        if (! empty($data['search'])) {
            $query->where(function ($q) use ($data) {
                $q->where('title', 'like', '%'.$data['search'].'%')
                    ->orWhere('location', 'like', '%'.$data['search'].'%')
                    ->orWhere('description', 'like', '%'.$data['search'].'%');
            });
        }

        return response()->json([
            'data' => $query->paginate(10),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', Rule::in(Report::CATEGORIES)],
            'priority' => ['required', Rule::in(Report::PRIORITIES)],
            'description' => ['required', 'string', 'min:20'],
            'location' => ['required', 'string', 'max:255'],
            'image' => ['nullable', 'image', 'max:4096'],
        ]);

        $imagePath = $request->hasFile('image')
            ? $request->file('image')->store('reports', 'public')
            : null;

        $report = Report::create([
            'user_id' => $request->user()->id,
            'title' => $data['title'],
            'category' => $data['category'],
            'priority' => $data['priority'],
            'description' => $data['description'],
            'location' => $data['location'],
            'image_path' => $imagePath,
            'status' => Report::STATUS_NEW,
        ]);

        $this->history($report, $request->user()->id, 'created', 'تم إنشاء البلاغ');

        return response()->json([
            'message' => 'تم إنشاء البلاغ بنجاح',
            'data' => $report->load(['user', 'technician', 'histories.user']),
        ], 201);
    }

    public function show(Request $request, Report $report)
    {
        $this->authorizeReportAccess($request, $report);

        return response()->json([
            'data' => $report->load(['user', 'technician', 'histories.user']),
        ]);
    }

    public function update(Request $request, Report $report)
    {
        $data = $request->validate([
            'status' => ['sometimes', Rule::in(Report::STATUSES)],
            'assigned_to' => ['sometimes', 'nullable', Rule::exists('users', 'id')->where('role', User::ROLE_TECHNICIAN)],
            'priority' => ['sometimes', Rule::in(Report::PRIORITIES)],
        ]);

        $oldStatus = $report->status;
        $oldAssignedTo = $report->assigned_to;

        if (array_key_exists('assigned_to', $data) && $data['assigned_to']) {
            $data['status'] = $data['status'] ?? Report::STATUS_ASSIGNED;
        }

        $report->update($data);

        if (isset($data['status']) && $data['status'] !== $oldStatus) {
            $this->history($report, $request->user()->id, 'status_changed', 'تم تغيير حالة البلاغ من '.$oldStatus.' إلى '.$data['status']);
        }

        if (array_key_exists('assigned_to', $data) && (int) $data['assigned_to'] !== (int) $oldAssignedTo) {
            $this->history($report, $request->user()->id, 'assigned', 'تم إسناد البلاغ إلى فني');
        }

        return response()->json([
            'message' => 'تم تحديث البلاغ بنجاح',
            'data' => $report->load(['user', 'technician', 'histories.user']),
        ]);
    }

    public function destroy(Request $request, Report $report)
    {
        $this->history($report, $request->user()->id, 'deleted', 'تم حذف البلاغ');
        $report->delete();

        return response()->json([
            'message' => 'تم حذف البلاغ بنجاح',
        ]);
    }

    public function assign(Request $request, Report $report)
    {
        $data = $request->validate([
            'assigned_to' => ['required', Rule::exists('users', 'id')->where('role', User::ROLE_TECHNICIAN)],
        ]);

        $oldAssignedTo = $report->assigned_to;

        $report->update([
            'assigned_to' => $data['assigned_to'],
            'status' => Report::STATUS_ASSIGNED,
        ]);

        if ((int) $oldAssignedTo !== (int) $data['assigned_to']) {
            $this->history($report, $request->user()->id, 'assigned', 'تم إسناد البلاغ إلى فني');
        }

        return response()->json([
            'message' => 'تم إسناد البلاغ بنجاح',
            'data' => $report->load(['user', 'technician', 'histories.user']),
        ]);
    }

    public function changeStatus(Request $request, Report $report)
    {
        $user = $request->user();

        if ($user->role === User::ROLE_TECHNICIAN && $report->assigned_to !== $user->id) {
            return response()->json(['message' => 'هذا البلاغ غير مسند لك'], 403);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(Report::STATUSES)],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $oldStatus = $report->status;

        $report->update([
            'status' => $data['status'],
        ]);

        if ($oldStatus !== $data['status']) {
            $this->history($report, $user->id, 'status_changed', $data['note'] ?? ('تم تغيير حالة البلاغ من '.$oldStatus.' إلى '.$data['status']));
        }

        return response()->json([
            'message' => 'تم تغيير حالة البلاغ بنجاح',
            'data' => $report->load(['user', 'technician', 'histories.user']),
        ]);
    }

    private function authorizeReportAccess(Request $request, Report $report): void
    {
        $user = $request->user();

        abort_if(
            $user->role === User::ROLE_CITIZEN && $report->user_id !== $user->id,
            403,
            'غير مصرح لك بعرض هذا البلاغ'
        );

        abort_if(
            $user->role === User::ROLE_TECHNICIAN && $report->assigned_to !== $user->id,
            403,
            'غير مصرح لك بعرض هذا البلاغ'
        );
    }

    private function history(Report $report, ?int $userId, string $action, string $note): void
    {
        ReportHistory::create([
            'report_id' => $report->id,
            'user_id' => $userId,
            'action' => $action,
            'note' => $note,
        ]);
    }
}
