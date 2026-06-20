<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/stats/overview', [StatsController::class, 'overview']);

    Route::get('/reports', [ReportController::class, 'index']);
    Route::post('/reports', [ReportController::class, 'store'])->middleware('role:citizen,admin');
    Route::get('/reports/{report}', [ReportController::class, 'show']);

    Route::patch('/reports/{report}/status', [ReportController::class, 'changeStatus'])
        ->middleware('role:admin,technician');

    Route::patch('/reports/{report}/assign', [ReportController::class, 'assign'])
        ->middleware('role:admin');

    Route::patch('/reports/{report}', [ReportController::class, 'update'])
        ->middleware('role:admin');

    Route::delete('/reports/{report}', [ReportController::class, 'destroy'])
        ->middleware('role:admin');

    Route::get('/users', [UserController::class, 'index'])->middleware('role:admin');
    Route::get('/users/technicians', [UserController::class, 'technicians'])->middleware('role:admin');
    Route::post('/users/technicians', [UserController::class, 'storeTechnician'])->middleware('role:admin');
});
