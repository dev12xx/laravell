<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use HasFactory;

    protected $fillable = [
        'tracking_id',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function getRouteKeyName(): string
    {
        return 'tracking_id';
    }
}
