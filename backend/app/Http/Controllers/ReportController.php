<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
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

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'tracking_id' => 'required|string|max:255',
            'payload' => 'required|array',
        ]);

        $report = Report::updateOrCreate(
            ['tracking_id' => $data['tracking_id']],
            ['payload' => $data['payload']]
        );

        $status = $report->wasRecentlyCreated ? 201 : 200;

        return response()->json([
            'tracking_id' => $report->tracking_id,
            'payload' => $report->payload,
        ], $status);
    }

    /**
     * Display the specified resource.
     *
     * @param  \App\Models\Report  $report
     * @return \Illuminate\Http\Response
     */
    public function show(Report $report)
    {
        return response()->json([
            'tracking_id' => $report->tracking_id,
            'payload' => $report->payload,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Models\Report  $report
     * @return \Illuminate\Http\Response
     */
    public function edit(Report $report)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Report  $report
     * @return \Illuminate\Http\Response
     */
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

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\Report  $report
     * @return \Illuminate\Http\Response
     */
    public function destroy(Report $report)
    {
        $report->delete();

        return response()->json(null, 204);
    }
}
