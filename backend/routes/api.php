<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\VerificationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminReportController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::apiResource('items', ItemController::class);
Route::apiResource('reports', ReportController::class);
Route::post('verification/send-code', [VerificationController::class, 'sendCode']);
Route::get('/test', function () {
    return response()->json(['message' => 'Backend is working!']);
});

Route::post('admin/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('reports', [AdminReportController::class, 'index']);
    Route::patch('reports/{report}', [AdminReportController::class, 'update']);
    Route::delete('reports/{report}', [AdminReportController::class, 'destroy']);
});
