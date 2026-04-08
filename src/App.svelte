<script>
  import Sidebar from "./components/Sidebar.svelte";
  import AnalyticsPage from "./routes/AnalyticsPage.svelte";
  import NotebookPage from "./routes/NotebookPage.svelte";
  import SettingsPage from "./routes/SettingsPage.svelte";

  let { route = "notebook" } = $props();

  const pages = {
    notebook: {
      title: "Quick Lookup Notebook",
      component: NotebookPage,
    },
    analytics: {
      title: "Quick Lookup Analytics",
      component: AnalyticsPage,
    },
    options: {
      title: "Quick Lookup Settings",
      component: SettingsPage,
    },
  };

  const currentPage = $derived(pages[route] || pages.notebook);
  const CurrentComponent = $derived(currentPage.component);

  $effect(() => {
    document.title = currentPage.title;
    document.body.className = "";
  });
</script>

<div
  class="min-h-screen bg-[radial-gradient(circle_at_15%_6%,rgba(26,77,232,0.15),transparent_28%),radial-gradient(circle_at_95%_20%,rgba(31,160,230,0.15),transparent_26%),linear-gradient(100deg,#eef1fa,#f8f8fc)] text-slate-900 font-[Trebuchet_MS,Segoe_UI,system-ui,sans-serif] dark:bg-[radial-gradient(circle_at_15%_6%,rgba(103,196,255,0.14),transparent_28%),radial-gradient(circle_at_95%_20%,rgba(80,180,255,0.14),transparent_26%),linear-gradient(100deg,#262838,#1f1f2d)] dark:text-slate-50 lg:grid lg:grid-cols-[260px_minmax(0,1fr)]"
  style="color-scheme: light dark"
>
  <Sidebar currentRoute={route} />

  <main class="p-4.5 lg:p-7">
    <CurrentComponent />
  </main>
</div>
