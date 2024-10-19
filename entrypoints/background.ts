import "~/assets/tailwind.css";

export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });
});
