<script>
    let { currentRoute } = $props();

    const navItems = [
        {
            href: "notebook.html",
            route: "notebook",
            label: "Notebook",
            detail: "Edit and preview markdown"
        },
        {
            href: "analytics.html",
            route: "analytics",
            label: "Analytics",
            detail: "Learning progress and lookup trends"
        },
        {
            href: "options.html",
            route: "options",
            label: "Settings",
            detail: "Dictionary and shortcut"
        }
    ];

    function linkClass(route) {
        const isActive = route === currentRoute;

        return [
            "flex min-h-16 items-center gap-2.5 rounded-2xl border px-3.5 py-3 transition duration-150",
            isActive
                ? "border-blue-600/20 bg-blue-600/10 font-semibold text-slate-900 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-slate-50"
                : "border-transparent text-slate-900 hover:translate-x-0.5 hover:border-slate-900/10 hover:bg-white/75 dark:text-slate-50 dark:hover:border-white/10 dark:hover:bg-white/5"
        ].join(" ");
    }
</script>

<aside class="top-0 flex h-auto flex-col gap-5 border-b border-slate-900/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent),#f4f6fd] p-5 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent),#242739] lg:sticky lg:h-screen lg:border-b-0 lg:border-r lg:px-[18px] lg:py-6">
    <div class="flex min-h-[86px] items-center gap-3 rounded-[18px] border border-slate-900/10 bg-white/90 p-3 shadow-[0_18px_48px_rgba(65,70,115,0.18)] backdrop-blur dark:border-white/10 dark:bg-[#2a2c3d]/90 dark:shadow-[0_24px_54px_rgba(0,0,0,0.34)]">
        <img
            src="icons/icon-128.png"
            alt="Quick Lookup icon"
            class="h-[46px] w-[46px] rounded-xl border border-slate-900/10 bg-white p-1.5 dark:border-white/10 dark:bg-[#2d3042]"
        />
        <div>
            <h1 class="text-base font-semibold">Quick Lookup</h1>
            <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Dictionary shortcut and study notebook.</p>
        </div>
    </div>

    <nav class="mt-1 flex flex-col gap-2" aria-label="Main navigation">
        {#each navItems as item}
            <a href={item.href} class={linkClass(item.route)} aria-current={item.route === currentRoute ? "page" : undefined}>
                <div class="flex flex-col gap-0.5">
                    <span class={item.route === currentRoute ? "" : "font-medium"}>{item.label}</span>
                    <span class="text-[0.82rem] font-normal text-slate-600 dark:text-slate-300">{item.detail}</span>
                </div>
            </a>
        {/each}
    </nav>

    <div class="mt-auto rounded-2xl border border-slate-900/10 bg-white/90 p-3.5 text-sm leading-6 text-slate-600 shadow-[0_18px_48px_rgba(65,70,115,0.08)] dark:border-white/10 dark:bg-[#2a2c3d]/90 dark:text-slate-300">
        Move between Notebook, Analytics, and Settings without the navigation shifting around.
    </div>
</aside>
