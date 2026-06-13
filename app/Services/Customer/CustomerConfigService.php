<?php

namespace App\Services\Customer;

use App\Services\Dashboard\OptionService;

class CustomerConfigService
{
    protected OptionService $optionService;

    public function __construct(OptionService $optionService)
    {
        $this->optionService = $optionService;
    }

    public function isRegistrationAllowed(): bool
    {
        return filter_var($this->optionService->get('allow_customer_registration', true), FILTER_VALIDATE_BOOLEAN);
    }

    public function isLoginAllowed(): bool
    {
        return filter_var($this->optionService->get('allow_customer_login', true), FILTER_VALIDATE_BOOLEAN);
    }

    public function isPasswordResetAllowed(): bool
    {
        return filter_var($this->optionService->get('allow_password_reset', true), FILTER_VALIDATE_BOOLEAN);
    }

    public function isEmailVerificationRequired(): bool
    {
        return filter_var($this->optionService->get('require_email_verification', false), FILTER_VALIDATE_BOOLEAN);
    }

    public function getAllConfigs(): array
    {
        return [
            'allow_customer_registration' => $this->isRegistrationAllowed(),
            'allow_customer_login' => $this->isLoginAllowed(),
            'allow_password_reset' => $this->isPasswordResetAllowed(),
            'require_email_verification' => $this->isEmailVerificationRequired(),
        ];
    }
}
