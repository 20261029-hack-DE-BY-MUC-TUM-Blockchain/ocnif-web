import type { ReactNode, Ref } from "react";
import { Button } from "@/components/ui/buttons/Button/Button";
import { Icon } from "@/components/ui/data-display/Icon/Icon";
import { usePreferences } from "../settings/Preferences";
import styles from "./Workspace.module.css";

export function DetailsToggle({
  open,
  onClick,
  ref,
}: {
  open: boolean;
  onClick: () => void;
  ref?: Ref<HTMLButtonElement>;
}) {
  const { t } = usePreferences();
  const label = open ? t.hideDetails : t.showDetails;
  return (
    <Button
      ref={ref}
      variant="icon"
      aria-label={label}
      title={label}
      aria-controls="workspace-details"
      aria-expanded={open}
      onClick={onClick}
    >
      <Icon name={open ? "close" : "activity"} />
    </Button>
  );
}

export function WorkspaceDetails({
  onClose,
  children,
  ref,
}: {
  onClose: () => void;
  children: ReactNode;
  ref?: Ref<HTMLElement>;
}) {
  const { t } = usePreferences();
  return (
    <aside
      ref={ref}
      id="workspace-details"
      className={styles.details}
      aria-labelledby="workspace-details-heading"
      tabIndex={-1}
    >
      <header className={styles.detailsHeader}>
        <h2 id="workspace-details-heading">{t.detailsTitle}</h2>
        <Button variant="icon" aria-label={t.hideDetails} onClick={onClose}>
          <Icon name="close" />
        </Button>
      </header>
      {children}
    </aside>
  );
}
