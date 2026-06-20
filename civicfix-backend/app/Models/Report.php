<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Report extends Model
{
    public const STATUS_NEW = 'new';
    public const STATUS_REVIEW = 'review';
    public const STATUS_ASSIGNED = 'assigned';
    public const STATUS_PROGRESS = 'progress';
    public const STATUS_RESOLVED = 'resolved';
    public const STATUS_REJECTED = 'rejected';

    public const STATUSES = [
        self::STATUS_NEW,
        self::STATUS_REVIEW,
        self::STATUS_ASSIGNED,
        self::STATUS_PROGRESS,
        self::STATUS_RESOLVED,
        self::STATUS_REJECTED,
    ];

    public const PRIORITY_LOW = 'low';
    public const PRIORITY_MEDIUM = 'medium';
    public const PRIORITY_HIGH = 'high';
    public const PRIORITY_URGENT = 'urgent';

    public const PRIORITIES = [
        self::PRIORITY_LOW,
        self::PRIORITY_MEDIUM,
        self::PRIORITY_HIGH,
        self::PRIORITY_URGENT,
    ];

    public const CATEGORIES = [
        'roads',
        'lighting',
        'water',
        'sanitation',
        'cleaning',
        'parks',
        'public_safety',
    ];

    protected $fillable = [
        'user_id',
        'title',
        'category',
        'priority',
        'status',
        'description',
        'location',
        'image_path',
        'assigned_to',
    ];

    protected $appends = [
        'image_url',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function histories()
    {
        return $this->hasMany(ReportHistory::class)->latest();
    }

    public function technician()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function getImageUrlAttribute()
    {
        if (! $this->image_path) {
            return null;
        }

        return Storage::url($this->image_path);
    }
}
