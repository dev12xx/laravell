<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class VerificationController extends Controller
{
    /**
     * Handle a request to send a verification code via email.
     */
    public function sendCode(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $code = strtoupper(Str::random(6));

        Mail::raw('Votre code de vérification est : ' . $code, function ($message) use ($data) {
            $message->to($data['email'])
                ->subject('Code de vérification');
        });

        return response()->json([
            'message' => 'Verification code sent.',
            'code' => $code,
        ]);
    }
}
