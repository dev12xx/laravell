<?php

use App\Http\Controllers\Api\Admin\AuthController;
use App\Http\Controllers\Api\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\VerificationController;
use Illuminate\Support\Facades\Route;

Route::post('admin/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('admin/reports', [AdminReportController::class, 'index']);
    Route::patch('admin/reports/{report}', [AdminReportController::class, 'update']);
    Route::delete('admin/reports/{report}', [AdminReportController::class, 'destroy']);
});

Route::get('reports', [ReportController::class, 'index']);
Route::post('reports', [ReportController::class, 'store']);
Route::get('reports/{report}', [ReportController::class, 'show']);
Route::patch('reports/{report}', [ReportController::class, 'update']);
Route::delete('reports/{report}', [ReportController::class, 'destroy']);

Route::post('verification/send-code', [VerificationController::class, 'sendCode']);
