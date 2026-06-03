<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Arr;

class CustomerResetPasswordNotification extends ResetPassword
{
    protected function resetUrl($notifiable): string
    {
        $frontendUrl = rtrim((string) config('customer.frontend_url'), '/');

        return $frontendUrl.'/reset-password?'.Arr::query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Reset Password Customer')
            ->greeting('Halo '.$notifiable->name)
            ->line('Anda menerima email ini karena ada permintaan reset password untuk akun customer Anda.')
            ->action('Reset Password', $this->resetUrl($notifiable))
            ->line('Link reset password ini berlaku selama '.config('auth.passwords.customers.expire', 60).' menit.')
            ->line('Jika Anda tidak meminta reset password, abaikan email ini.');
    }
}
