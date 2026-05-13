import { useStore } from '../../state/store';
import { Icon } from '../Icons';
import { ToolGroup, ToolbarButton } from './ToolbarPrimitives';

interface Props {
  onHelp: () => void;
}

export function ThemeGroup({ onHelp }: Props) {
  const theme    = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const next = theme === 'light' ? 'dark' : 'light';
  return (
    <ToolGroup>
      <ToolbarButton
        onClick={() => setTheme(next)}
        ariaLabel="Toggle theme"
        title={`Switch to ${next} theme`}
      >
        <Icon name={theme === 'light' ? 'moon' : 'sun'} />
      </ToolbarButton>
      <ToolbarButton onClick={onHelp} ariaLabel="Help" title="Shortcuts (?)">
        <Icon name="help" />
      </ToolbarButton>
    </ToolGroup>
  );
}
