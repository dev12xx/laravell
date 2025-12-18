<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Http\Request;

class AdminReportController extends Controller
{
    public function index()
    {
        $reports = Report::orderByDesc('created_at')->get()->map(function (Report $report) {
            return [
                'tracking_id' => $report->tracking_id,
                'payload' => $report->payload,
            ];
        });

        return response()->json($reports);
    }

    public function update(Request $request, Report $report)
    {
        $data = $request->validate([
            'payload' => 'required|array',
        ]);

        $report->update([
            'payload' => $data['payload'],
        ]);

        return response()->json([
            'tracking_id' => $report->tracking_id,
            'payload' => $report->payload,
        ]);
    }

    public function destroy(Report $report)
    {
        $report->delete();

        return response()->json(null, 204);
    }
}
