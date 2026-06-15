import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Eye,
    KeyRound,
    Power,
    ShoppingCart,
    Trash,
    Users,
} from 'lucide-react';
import { useState } from 'react';

import { DataTable } from '@/components/DataTable';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { LaravelPagination } from '@/types/LaravelPagination';

interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    is_active: boolean;
    last_login_at?: string | null;
    orders_count: number;
    carts_count: number;
    paid_revenue?: number | string | null;
    created_at: string;
}

interface Summary {
    total_customers: number;
    active_customers: number;
    disabled_customers: number;
    customers_with_orders: number;
    customers_with_carts: number;
    total_revenue: number;
}

interface Props {
    customers: LaravelPagination<Customer>;
    summary: Summary;
    filters: {
        search?: string;
        status?: string;
    };
}

const money = (value: number | string | null | undefined) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(Number(value ?? 0));

export default function Index({ customers, summary, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [resetId, setResetId] = useState<string | null>(null);

    const applyFilter = () => {
        router.get(
            '/my-admin/dashboard/ecommerce/customers',
            { search, status },
            { preserveState: true, replace: true },
        );
    };

    const clearFilter = () => {
        setSearch('');
        setStatus('');
        router.get(
            '/my-admin/dashboard/ecommerce/customers',
            {},
            { replace: true },
        );
    };

    const toggleLogin = (customer: Customer) => {
        router.patch(
            `/my-admin/dashboard/ecommerce/customers/${customer.id}/toggle-login`,
            {},
            { preserveScroll: true },
        );
    };

    const resetPassword = () => {
        if (!resetId) {
            return;
        }

        router.post(
            `/my-admin/dashboard/ecommerce/customers/${resetId}/reset-password`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setResetId(null),
            },
        );
    };

    const deleteCustomer = () => {
        if (!deleteId) {
            return;
        }

        router.delete(`/my-admin/dashboard/ecommerce/customers/${deleteId}`, {
            preserveScroll: true,
            onFinish: () => setDeleteId(null),
        });
    };

    const columns = [
        {
            label: 'Customer',
            render: (row: Customer) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-foreground">
                        {row.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {row.email}
                    </span>
                    {row.phone && (
                        <span className="text-xs text-muted-foreground">
                            {row.phone}
                        </span>
                    )}
                </div>
            ),
        },
        {
            label: 'Login',
            render: (row: Customer) => (
                <span
                    className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                        row.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                    }`}
                >
                    {row.is_active ? 'Active' : 'Disabled'}
                </span>
            ),
        },
        {
            label: 'Activity',
            render: (row: Customer) => (
                <div className="flex flex-col text-sm">
                    <span>{row.orders_count} orders</span>
                    <span className="text-xs text-muted-foreground">
                        {row.carts_count} carts
                    </span>
                </div>
            ),
        },
        {
            label: 'Paid Revenue',
            render: (row: Customer) => (
                <span className="text-sm font-semibold">
                    {money(row.paid_revenue)}
                </span>
            ),
        },
        {
            label: 'Last Login',
            render: (row: Customer) => (
                <span className="text-sm text-muted-foreground">
                    {row.last_login_at
                        ? new Date(row.last_login_at).toLocaleString('id-ID')
                        : '-'}
                </span>
            ),
        },
        {
            label: 'Actions',
            render: (row: Customer) => (
                <div className="flex flex-wrap gap-2">
                    <Link
                        href={`/my-admin/dashboard/ecommerce/customers/${row.id}`}
                    >
                        <Button size="sm" variant="secondary" title="Detail">
                            <Eye className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                    <Button
                        size="sm"
                        variant={row.is_active ? 'outline' : 'secondary'}
                        title={row.is_active ? 'Disable login' : 'Enable login'}
                        onClick={() => toggleLogin(row)}
                    >
                        <Power className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        title="Reset password"
                        onClick={() => setResetId(row.id)}
                    >
                        <KeyRound className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        title="Delete customer"
                        onClick={() => setDeleteId(row.id)}
                    >
                        <Trash className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Customers" />

            <div className="container mx-auto space-y-8 px-6 py-8">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                        <Users className="h-6 w-6 text-primary" />
                        Customers
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Monitor customer accounts, login access, cart activity,
                        and order history.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                    <SummaryCard
                        label="Total"
                        value={summary.total_customers.toLocaleString('id-ID')}
                    />
                    <SummaryCard
                        label="Active"
                        value={summary.active_customers.toLocaleString('id-ID')}
                    />
                    <SummaryCard
                        label="Disabled"
                        value={summary.disabled_customers.toLocaleString(
                            'id-ID',
                        )}
                    />
                    <SummaryCard
                        label="With Orders"
                        value={summary.customers_with_orders.toLocaleString(
                            'id-ID',
                        )}
                    />
                    <SummaryCard
                        label="With Carts"
                        value={summary.customers_with_carts.toLocaleString(
                            'id-ID',
                        )}
                    />
                    <SummaryCard
                        label="Paid Revenue"
                        value={money(summary.total_revenue)}
                    />
                </div>

                <div className="flex flex-wrap gap-3">
                    <Input
                        className="max-w-xs"
                        placeholder="Search name, email, phone..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        onKeyDown={(event) =>
                            event.key === 'Enter' && applyFilter()
                        }
                    />
                    <select
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="active">Active Login</option>
                        <option value="disabled">Disabled Login</option>
                    </select>
                    <Button onClick={applyFilter}>Filter</Button>
                    <Button variant="outline" onClick={clearFilter}>
                        Clear
                    </Button>
                </div>

                <DataTable<Customer> data={customers.data} columns={columns} />

                <div className="flex flex-wrap gap-2">
                    {customers.links.map((link, index) => (
                        <button
                            key={index}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            disabled={!link.url}
                            onClick={() => link.url && router.visit(link.url)}
                            className={`rounded px-3 py-1 text-sm ${
                                link.active
                                    ? 'bg-primary font-semibold text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted'
                            } ${!link.url && 'pointer-events-none opacity-50'}`}
                        />
                    ))}
                </div>
            </div>

            <ConfirmDialog
                open={!!resetId}
                title="Reset customer password?"
                description="A temporary password will be generated and shown in the flash message."
                actionLabel="Reset Password"
                icon={KeyRound}
                onOpenChange={() => setResetId(null)}
                onAction={resetPassword}
            />

            <ConfirmDialog
                open={!!deleteId}
                title="Delete customer data?"
                description="Customer will be soft-deleted and linked carts/orders will be detached from the account."
                actionLabel="Delete"
                destructive
                icon={AlertTriangle}
                onOpenChange={() => setDeleteId(null)}
                onAction={deleteCustomer}
            />
        </>
    );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {label}
            </span>
            <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
        </div>
    );
}

function ConfirmDialog({
    open,
    title,
    description,
    actionLabel,
    destructive = false,
    icon: Icon,
    onOpenChange,
    onAction,
}: {
    open: boolean;
    title: string;
    description: string;
    actionLabel: string;
    destructive?: boolean;
    icon: React.ElementType;
    onOpenChange: () => void;
    onAction: () => void;
}) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onAction}
                        className={
                            destructive
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : undefined
                        }
                    >
                        {actionLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
