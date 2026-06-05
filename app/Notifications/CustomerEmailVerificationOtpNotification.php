<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CustomerEmailVerificationOtpNotification extends Notification
{
    public function __construct(
        public readonly string $otp,
        public readonly int $expiresInMinutes,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Kode OTP Aktivasi Akun Customer')
            ->greeting('Halo '.$notifiable->name)
            ->line('Gunakan kode OTP berikut untuk aktivasi akun customer Anda:')
            ->line($this->otp)
            ->line('Kode OTP ini berlaku selama '.$this->expiresInMinutes.' menit.')
            ->line('Jika Anda tidak melakukan registrasi akun, abaikan email ini.');
    }
}
