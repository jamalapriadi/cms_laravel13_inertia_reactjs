import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface FaqItem {
    id: string;
    question: string;
    answer: string;
    type: string;
    position: string | null;
}

interface Props {
    faqs: FaqItem[];
    title?: string;
    description?: string;
}

export default function FaqSection({ faqs, title, description }: Props) {
    const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);

    if (!faqs.length) {
        return null;
    }

    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold">
                    {title || 'Frequently Asked Questions'}
                </h2>
                <p className="text-sm text-muted-foreground">
                    {description ||
                        'Pertanyaan umum seputar belanja, pembayaran, pengiriman, dan promo.'}
                </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-card dark:border-zinc-800">
                {faqs.map((faq, index) => (
                    <Collapsible
                        key={faq.id}
                        open={openId === faq.id}
                        onOpenChange={(open) => setOpenId(open ? faq.id : null)}
                        className={
                            index !== 0
                                ? 'border-t border-zinc-200 dark:border-zinc-800'
                                : ''
                        }
                    >
                        <CollapsibleTrigger className="group flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium transition hover:bg-zinc-50 dark:hover:bg-zinc-900">
                            <span>{faq.question}</span>
                            <ChevronDown
                                className={`h-4 w-4 shrink-0 transition ${openId === faq.id ? 'rotate-180' : ''}`}
                            />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-5 pb-4 text-sm leading-6 text-muted-foreground">
                            {faq.answer}
                        </CollapsibleContent>
                    </Collapsible>
                ))}
            </div>
        </section>
    );
}
