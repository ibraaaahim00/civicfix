<?php

use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('a citizen can register and receives an api token', function () {
    $response = $this->postJson('/api/auth/register', [
        'name' => 'مواطن جديد',
        'email' => 'new.citizen@example.com',
        'password' => 'Password@123',
        'password_confirmation' => 'Password@123',
    ]);

    $response->assertCreated()
        ->assertJsonPath('user.email', 'new.citizen@example.com')
        ->assertJsonPath('user.role', User::ROLE_CITIZEN)
        ->assertJsonStructure(['token', 'user']);

    $user = User::where('email', 'new.citizen@example.com')->firstOrFail();
    expect(Hash::check('Password@123', $user->password))->toBeTrue();
});

test('a citizen can log in and submit a report', function () {
    $citizen = User::factory()->create([
        'role' => User::ROLE_CITIZEN,
        'password' => 'Password@123',
    ]);

    $login = $this->postJson('/api/auth/login', [
        'email' => $citizen->email,
        'password' => 'Password@123',
    ]);

    $login->assertOk()->assertJsonStructure(['token', 'user']);

    $response = $this->actingAs($citizen, 'sanctum')->postJson('/api/reports', [
        'title' => 'مشكلة تحتاج متابعة',
        'category' => Report::CATEGORIES[0],
        'priority' => Report::PRIORITY_HIGH,
        'description' => 'وصف واضح للمشكلة يحتوي على أكثر من عشرين حرفا.',
        'location' => 'شارع التحرير، بجوار الميدان',
    ]);

    $response->assertCreated()->assertJsonPath('data.status', Report::STATUS_NEW);
    $this->assertDatabaseHas('reports', [
        'user_id' => $citizen->id,
        'title' => 'مشكلة تحتاج متابعة',
        'status' => Report::STATUS_NEW,
    ]);
});

test('a citizen cannot access another citizen report', function () {
    $owner = User::factory()->create(['role' => User::ROLE_CITIZEN]);
    $otherCitizen = User::factory()->create(['role' => User::ROLE_CITIZEN]);
    $report = Report::create([
        'user_id' => $owner->id,
        'title' => 'بلاغ خاص بصاحبه',
        'category' => Report::CATEGORIES[0],
        'priority' => Report::PRIORITY_MEDIUM,
        'status' => Report::STATUS_NEW,
        'description' => 'وصف تجريبي واضح للمشكلة يتجاوز الحد الأدنى المطلوب.',
        'location' => 'شارع تجريبي',
    ]);

    $this->actingAs($otherCitizen, 'sanctum')
        ->getJson('/api/reports/'.$report->id)
        ->assertForbidden();
});
