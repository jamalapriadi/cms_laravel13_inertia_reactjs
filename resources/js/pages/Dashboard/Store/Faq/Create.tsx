import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Textarea from '@/components/ui/textarea';

interface OptionItem {
    value: string;
    label: string;
}

interface Props {
    typeOptions: OptionItem[];
    positionOptions: OptionItem[];
}

interface FormData {
    question: string;
    answer: string;
    type: string;
    position: string;
    is_active: boolean;
    show_home: boolean;
    sort_order: number;
}

export default function Create({ typeOptions, positionOptions }: Props) {
    const { data, setData, post, processing, errors, transform } =
        useForm<FormData>({
            question: '',
            answer: '',
            type: 'general',
            position: '',
            is_active: true,
            show_home: false,
            sort_order: 0,
        });

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        transform((current) => ({
            ...current,
            position: current.position || null,
        }));

        post('/my-admin/dashboard/ecommerce/faqs');
    };

    return (
        <>
            <Head title="Create FAQ" />

            <div className="container mx-auto max-w-4xl space-y-8 px-6 py-8">
                <div className="flex items-center gap-4">
                    <Link href="/my-admin/dashboard/ecommerce/faqs">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Create FAQ</h1>
                        <p className="text-sm text-muted-foreground">
                            Add reusable FAQ item for ecommerce sections.
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Question" required className="md:col-span-2">
                            <Input
                                value={data.question}
                                onChange={(event) =>
                                    setData('question', event.target.value)
                                }
                            />
                            <Error message={errors.question} />
                        </Field>

                        <Field label="Answer" required className="md:col-span-2">
                            <Textarea
                                rows={6}
                                value={data.answer}
                                onChange={(event) =>
                                    setData('answer', event.target.value)
                                }
                            />
                            <Error message={errors.answer} />
                        </Field>

                        <Field label="Type" required>
                            <select
                                value={data.type}
                                onChange={(event) => setData('type', event.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                {typeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <Error message={errors.type} />
                        </Field>

                        <Field label="Position">
                            <select
                                value={data.position}
                                onChange={(event) =>
                                    setData('position', event.target.value)
                                }
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="">No specific position</option>
                                {positionOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <Error message={errors.position} />
                        </Field>

                        <Field label="Sort Order">
                            <Input
                                type="number"
                                min={0}
                                value={data.sort_order}
                                onChange={(event) =>
                                    setData('sort_order', Number(event.target.value || 0))
                                }
                            />
                            <Error message={errors.sort_order} />
                        </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                            <Label htmlFor="is_active">Active</Label>
                            <Switch
                                id="is_active"
                                checked={data.is_active}
                                onCheckedChange={(checked) =>
                                    setData('is_active', checked)
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                            <Label htmlFor="show_home">Show on Home</Label>
                            <Switch
                                id="show_home"
                                checked={data.show_home}
                                onCheckedChange={(checked) =>
                                    setData('show_home', checked)
                                }
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Link href="/my-admin/dashboard/ecommerce/faqs">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Create FAQ'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

function Field({
    label,
    required = false,
    className = '',
    children,
}: {
    label: string;
    required?: boolean;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={`space-y-2 ${className}`}>
            <Label>
                {label}
                {required ? ' *' : ''}
            </Label>
            {children}
        </div>
    );
}

function Error({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="text-xs text-destructive">{message}</p>;
}
