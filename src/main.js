import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";

const target = document.getElementById("app");
const route = document.body.dataset.route || "notebook";

mount(App, {
    target,
    props: {
        route
    }
});
