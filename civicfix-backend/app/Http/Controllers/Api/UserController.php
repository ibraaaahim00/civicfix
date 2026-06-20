<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate([
            'role' => ['nullable', Rule::in(User::ROLES)],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $query = User::query()
            ->withCount(['reports', 'assignedReports'])
            ->latest();

        if (! empty($data['role'])) {
            $query->where('role', $data['role']);
        }

        if (! empty($data['search'])) {
            $query->where(function ($q) use ($data) {
                $q->where('name', 'like', '%'.$data['search'].'%')
                    ->orWhere('email', 'like', '%'.$data['search'].'%');
            });
        }

        return response()->json([
            'data' => $query->paginate(20),
        ]);
    }

    public function storeTechnician(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $technician = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => User::ROLE_TECHNICIAN,
        ]);

        return response()->json([
            'message' => 'تم إضافة الفني بنجاح',
            'data' => $technician,
        ], 201);
    }

    public function technicians()
    {
        $technicians = User::where('role', User::ROLE_TECHNICIAN)
            ->select(['id', 'name', 'email', 'role'])
            ->withCount('assignedReports')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $technicians,
        ]);
    }
}
