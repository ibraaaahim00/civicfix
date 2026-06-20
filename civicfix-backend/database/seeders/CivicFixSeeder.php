<?php

namespace Database\Seeders;

use App\Models\Report;
use App\Models\ReportHistory;
use App\Models\User;
use Illuminate\Database\Seeder;

class CivicFixSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@civicfix.local'],
            ['name' => 'مدير منصة البلاغات', 'password' => 'Admin@12345', 'role' => User::ROLE_ADMIN]
        );

        $technicians = collect([
            ['name' => 'محمود حسن - صيانة طرق', 'email' => 'roads.tech@civicfix.local'],
            ['name' => 'سارة إبراهيم - إنارة ومرافق', 'email' => 'utilities.tech@civicfix.local'],
            ['name' => 'أحمد عبدالعزيز - نظافة وتشجير', 'email' => 'cleaning.tech@civicfix.local'],
        ])->map(fn (array $tech) => User::firstOrCreate(
            ['email' => $tech['email']],
            ['name' => $tech['name'], 'password' => 'Tech@12345', 'role' => User::ROLE_TECHNICIAN]
        ));

        $citizens = collect([
            ['name' => 'منى علي', 'email' => 'mona.ali@example.com'],
            ['name' => 'كريم مصطفى', 'email' => 'karim.mostafa@example.com'],
            ['name' => 'هبة سامي', 'email' => 'heba.samy@example.com'],
        ])->map(fn (array $citizen) => User::firstOrCreate(
            ['email' => $citizen['email']],
            ['name' => $citizen['name'], 'password' => 'Citizen@12345', 'role' => User::ROLE_CITIZEN]
        ));

        $reports = [
            [
                'user_id' => $citizens[0]->id,
                'title' => 'هبوط في الأسفلت أمام مدرسة النيل',
                'category' => 'roads',
                'priority' => 'urgent',
                'status' => 'assigned',
                'description' => 'يوجد هبوط واضح في الأسفلت بجوار مطب المدرسة ويتسبب في ازدحام وخطر على السيارات وقت خروج الطلاب.',
                'location' => 'مدينة نصر، شارع مصطفى النحاس، أمام مدرسة النيل',
                'assigned_to' => $technicians[0]->id,
            ],
            [
                'user_id' => $citizens[1]->id,
                'title' => 'كشاف إنارة لا يعمل عند مدخل العقار',
                'category' => 'lighting',
                'priority' => 'high',
                'status' => 'progress',
                'description' => 'كشاف الإنارة متوقف منذ ثلاثة أيام والمدخل مظلم بالكامل بعد الساعة الثامنة مساء.',
                'location' => 'المعادي، شارع 9، أمام عقار 42',
                'assigned_to' => $technicians[1]->id,
            ],
            [
                'user_id' => $citizens[2]->id,
                'title' => 'تسريب مياه بجوار غرفة المحابس',
                'category' => 'water',
                'priority' => 'urgent',
                'status' => 'review',
                'description' => 'المياه تتجمع بجوار غرفة المحابس منذ الصباح ويظهر أنها قادمة من وصلة أرضية تحتاج معاينة عاجلة.',
                'location' => 'التجمع الخامس، الحي الثالث، بجوار مسجد الرحمن',
                'assigned_to' => null,
            ],
            [
                'user_id' => $citizens[1]->id,
                'title' => 'تراكم مخلفات بجوار سور الحديقة',
                'category' => 'cleaning',
                'priority' => 'medium',
                'status' => 'resolved',
                'description' => 'تم تجميع مخلفات تشجير بجوار سور الحديقة وتحتاج سيارة رفع نظافة قبل نهاية اليوم.',
                'location' => 'الشيخ زايد، المجاورة الرابعة، الحديقة المركزية',
                'assigned_to' => $technicians[2]->id,
            ],
            [
                'user_id' => $citizens[0]->id,
                'title' => 'غطاء بالوعة مكسور في منتصف الشارع',
                'category' => 'sanitation',
                'priority' => 'high',
                'status' => 'new',
                'description' => 'غطاء البالوعة مكسور ومائل للداخل في مسار السيارات، وتم وضع حجر مؤقت حوله لكنه ما زال يمثل خطورة.',
                'location' => 'الدقي، شارع التحرير، بجوار محطة المترو',
                'assigned_to' => null,
            ],
        ];

        foreach ($reports as $reportData) {
            $report = Report::firstOrCreate(
                ['title' => $reportData['title'], 'location' => $reportData['location']],
                $reportData
            );

            ReportHistory::firstOrCreate([
                'report_id' => $report->id,
                'action' => 'created',
            ], [
                'user_id' => $report->user_id,
                'note' => 'تم إنشاء البلاغ',
            ]);

            if ($report->assigned_to) {
                ReportHistory::firstOrCreate([
                    'report_id' => $report->id,
                    'action' => 'assigned',
                ], [
                    'user_id' => $admin->id,
                    'note' => 'تم إسناد البلاغ إلى فني مختص',
                ]);
            }

            if ($report->status === Report::STATUS_RESOLVED) {
                ReportHistory::firstOrCreate([
                    'report_id' => $report->id,
                    'action' => 'status_changed',
                ], [
                    'user_id' => $report->assigned_to,
                    'note' => 'تم إنهاء المعالجة وإغلاق البلاغ',
                ]);
            }
        }
    }
}
