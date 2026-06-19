<?php

namespace App\Services\Cashier;

use App\Models\Shop\CashierCashMovement;
use App\Models\Shop\CashierSession;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CashDrawerService
{
    public function createMovement(User $user, array $data): CashierCashMovement
    {
        return DB::transaction(function () use ($user, $data) {
            $session = null;
            if (! empty($data['cashier_session_id']) && $user->hasRole(['super-admin', 'admin', 'owner'])) {
                $session = CashierSession::findOrFail($data['cashier_session_id']);
            } else {
                $session = CashierSession::where('cashier_id', $user->id)
                    ->where('status', 'open')
                    ->first();

                if (! $session) {
                    throw new \Exception('Tidak ada session cashier aktif.');
                }
            }

            $amount = (float) $data['amount'];
            $type = $data['type'];

            // Determine direction if not explicit
            $direction = $data['direction'] ?? 'out';
            if ($type === 'cash_in') {
                $direction = 'in';
            } elseif (in_array($type, ['cash_out', 'owner_withdrawal', 'expense'])) {
                $direction = 'out';
            }

            // Determine if approval is needed
            $status = 'approved';
            $needsApproval = false;

            if ($type === 'cash_out') {
                $limit = config('cashier.cash_drawer.cash_out_requires_approval_above', 100000);
                if ($amount >= $limit) {
                    $needsApproval = true;
                }
            } elseif ($type === 'expense') {
                $limit = config('cashier.cash_drawer.expense_requires_approval_above', 100000);
                if ($amount >= $limit) {
                    $needsApproval = true;
                }
            } elseif ($type === 'owner_withdrawal') {
                if (config('cashier.cash_drawer.owner_withdrawal_requires_approval', true)) {
                    $needsApproval = true;
                }
            } elseif ($type === 'adjustment') {
                if (config('cashier.cash_drawer.adjustment_requires_approval', true)) {
                    if (! $user->hasRole(['super-admin', 'admin', 'owner'])) {
                        $needsApproval = true;
                    }
                }
            }

            // Auto approve if user is admin/owner
            if ($needsApproval && $user->hasRole(['super-admin', 'admin', 'owner'])) {
                $needsApproval = false;
            }

            if ($needsApproval) {
                $status = 'pending';
            }

            $movement = CashierCashMovement::create([
                'cashier_session_id' => $session->id,
                'cashier_id' => $session->cashier_id,
                'created_by' => $user->id,
                'type' => $type,
                'direction' => $direction,
                'amount' => $amount,
                'status' => $status,
                'reason' => $data['reason'],
                'note' => $data['note'] ?? null,
                'approved_by' => $status === 'approved' ? $user->id : null,
                'approved_at' => $status === 'approved' ? now() : null,
            ]);

            return $movement;
        });
    }

    public function approveMovement(CashierCashMovement $movement, User $approver, ?string $note = null): CashierCashMovement
    {
        if ($movement->status !== 'pending') {
            throw new \Exception("Movement cannot be approved. Current status: {$movement->status}");
        }

        if ($movement->created_by === $approver->id && ! $approver->hasRole('super-admin')) {
            throw new \Exception('Anda tidak dapat melakukan approve pada movement yang Anda buat sendiri.');
        }

        $movement->update([
            'status' => 'approved',
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'note' => $note ? $movement->note."\nApproval note: ".$note : $movement->note,
        ]);

        return $movement;
    }

    public function rejectMovement(CashierCashMovement $movement, User $approver, ?string $note = null): CashierCashMovement
    {
        if ($movement->status !== 'pending') {
            throw new \Exception("Movement cannot be rejected. Current status: {$movement->status}");
        }

        $movement->update([
            'status' => 'rejected',
            'approved_by' => $approver->id,
            'rejected_at' => now(),
            'note' => $note ? $movement->note."\nRejection note: ".$note : $movement->note,
        ]);

        return $movement;
    }

    public function cancelMovement(CashierCashMovement $movement, User $user, ?string $note = null): CashierCashMovement
    {
        if ($movement->status === 'cancelled') {
            throw new \Exception('Movement is already cancelled.');
        }

        if ($movement->status === 'approved') {
            if (! $user->can('cash-movements.cancel-approved') && ! $user->hasRole(['super-admin', 'admin', 'owner'])) {
                throw new \Exception('Anda tidak memiliki akses untuk cancel movement yang sudah approved.');
            }
        } elseif ($movement->status === 'pending') {
            if ($movement->created_by !== $user->id && ! $user->hasRole(['super-admin', 'admin', 'owner'])) {
                throw new \Exception('Anda hanya dapat membatalkan movement yang Anda buat sendiri.');
            }
        }

        $movement->update([
            'status' => 'cancelled',
            'note' => $note ? $movement->note."\nCancellation note: ".$note : $movement->note,
        ]);

        return $movement;
    }

    public function calculateSessionMovementSummary(CashierSession $session): array
    {
        $movements = $session->cashMovements()->where('status', 'approved')->get();

        $cashIn = $movements->where('type', 'cash_in')->sum('amount');
        $cashOut = $movements->where('type', 'cash_out')->sum('amount');
        $expense = $movements->where('type', 'expense')->sum('amount');
        $ownerWithdrawal = $movements->where('type', 'owner_withdrawal')->sum('amount');

        $adjustmentIn = $movements->where('type', 'adjustment')->where('direction', 'in')->sum('amount');
        $adjustmentOut = $movements->where('type', 'adjustment')->where('direction', 'out')->sum('amount');

        $adjustmentTotal = $adjustmentIn - $adjustmentOut;

        return [
            'cash_in_total' => $cashIn,
            'cash_out_total' => $cashOut,
            'expense_total' => $expense,
            'owner_withdrawal_total' => $ownerWithdrawal,
            'adjustment_total' => $adjustmentTotal,
            'net_movement' => $cashIn + $adjustmentIn - $cashOut - $expense - $ownerWithdrawal - $adjustmentOut,
        ];
    }
}
