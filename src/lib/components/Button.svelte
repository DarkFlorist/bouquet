<script lang="ts">
  export let onClick: null | ((arg0?: any) => any) = null;
  export let disabled: boolean = false;
  export let variant: "primary" | "success" | "error" = "primary";

  const classNames = {
    primary: `text-xl font-semibold border-2 rounded-md px-6 py-2 border-accent text-accent hover:bg-accent/20 active:text-primary active:bg-accent/40 disabled:border-secondary disabled:bg-secondary/30 active:disabled:text-accent`,
    success: `text-xl font-semibold border-2 rounded-md px-6 py-2 border-success text-success hover:bg-success/20 active:text-primary active:bg-success/40 disabled:border-secondary disabled:bg-secondary/30 active:disabled:text-success`,
    error: `text-xl font-semibold border-2 rounded-md px-6 py-2 border-error text-error hover:bg-error/20 active:text-primary active:bg-error/40 disabled:border-secondary disabled:bg-secondary/30 active:disabled:text-error`,
  };
</script>

<button on:click={onClick} {disabled} class={classNames[variant]}
  ><slot /></button
>
