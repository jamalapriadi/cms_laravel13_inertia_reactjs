export function filterSidebar(config: any[], role: string) {
    return config
        .filter((group) => {
            if (!group.roles) {
                return true;
            }

            return group.roles.includes(role);
        })
        .map((group) => ({
            ...group,
            items: group.items.filter((item: any) => {
                if (!item.roles) {
                    return true;
                }

                return item.roles.includes(role);
            }),
        }))
        .filter((group) => group.items.length > 0);
}
