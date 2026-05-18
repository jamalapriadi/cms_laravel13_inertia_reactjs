import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
} from '@/components/ui/sidebar';

export default function SidebarGroupItem({ label, children }: any) {
    const [open, setOpen] = useState(true);

    return (
        <SidebarGroup>
            <SidebarGroupLabel
                className="flex cursor-pointer items-center justify-between"
                onClick={() => setOpen(!open)}
            >
                {label}
                <ChevronDown
                    className={`size-4 transition ${open ? 'rotate-180' : ''}`}
                />
            </SidebarGroupLabel>

            {open && <SidebarMenu>{children}</SidebarMenu>}
        </SidebarGroup>
    );
}
