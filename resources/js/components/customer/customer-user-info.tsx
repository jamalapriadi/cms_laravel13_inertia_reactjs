import { useInitials } from '@/hooks/use-initials';
import type { CustomerSession } from './customer-types';

type Props = {
    customer: CustomerSession;
    showEmail?: boolean;
};

export function CustomerUserInfo({ customer, showEmail = false }: Props) {
    const getInitials = useInitials();

    return (
        <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">
                {customer.name || getInitials(customer.email)}
            </span>
            {showEmail && (
                <span className="truncate text-xs text-muted-foreground">
                    {customer.email}
                </span>
            )}
        </div>
    );
}
