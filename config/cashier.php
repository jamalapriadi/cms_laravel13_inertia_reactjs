<?php

return [
    'cash_drawer' => [
        'cash_out_requires_approval_above' => 100000,
        'expense_requires_approval_above' => 100000,
        'owner_withdrawal_requires_approval' => true,
        'adjustment_requires_approval' => true,
    ],

    'discount' => [
        'max_without_approval_percentage' => 5,
        'max_without_approval_amount' => 100000,
    ],

    'price_override' => [
        'requires_permission' => true,
        'requires_approval' => false,
    ],
];
