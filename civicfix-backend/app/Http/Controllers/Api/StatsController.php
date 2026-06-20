<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    public function overview(Request $request)
    {
        $user = $request->user();

        $query = Report::query();

        if ($user->role === User::ROLE_CITIZEN) {
            $query->where('user_id', $user->id);
        }

        if ($user->role === User::ROLE_TECHNICIAN) {
            $query->where('assigned_to', $user->id);
        }

        $total = (clone $query)->count();
        $active = (clone $query)->whereNotIn('status', [Report::STATUS_RESOLVED, Report::STATUS_REJECTED])->count();
        $resolved = (clone $query)->where('status', Report::STATUS_RESOLVED)->count();
        $urgent = (clone $query)->where('priority', Report::PRIORITY_URGENT)->count();

        return response()->json([
            'total' => $total,
            'active' => $active,
            'resolved' => $resolved,
            'urgent' => $urgent,
            'by_status' => (clone $query)->selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status'),
            'by_category' => (clone $query)->selectRaw('category, COUNT(*) as total')->groupBy('category')->pluck('total', 'category'),
            'by_priority' => (clone $query)->selectRaw('priority, COUNT(*) as total')->groupBy('priority')->pluck('total', 'priority'),
        ]);
    }
}
