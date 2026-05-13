// ML Lab — composite of six hands-on modes. Mode picker on the left;
// content fills the rest. Each mode composes the math primitives we've
// already built (compute-engine, graphers, ml-* helpers).

import { useState } from 'react';
import { PanelHeader, PanelStatus, Tabs, type TabItem } from '../../components/common';
import { RegressionMode } from './modes/RegressionMode';
import { DescentMode } from './modes/DescentMode';
import { DistributionsMode } from './modes/DistributionsMode';
import { ActivationsMode } from './modes/ActivationsMode';
import { PCAMode } from './modes/PCAMode';
import { MLPMode } from './modes/MLPMode';

const ITEMS: readonly TabItem[] = [
  { value: 'regression',    label: 'Regression',        content: <Pad><RegressionMode /></Pad> },
  { value: 'descent',       label: 'Gradient descent',  content: <Pad><DescentMode /></Pad> },
  { value: 'distributions', label: 'Distributions',     content: <Pad><DistributionsMode /></Pad> },
  { value: 'activations',   label: 'Activations',       content: <Pad><ActivationsMode /></Pad> },
  { value: 'pca',           label: 'PCA',               content: <Pad><PCAMode /></Pad> },
  { value: 'mlp',           label: 'Neural net',        content: <Pad><MLPMode /></Pad> },
];

export default function MLLabPanel() {
  const [mode, setMode] = useState('regression');
  return (
    <div className="flex flex-col h-full bg-surface">
      <PanelHeader title="ML Lab" icon="brain" />
      <div className="flex-1 overflow-hidden">
        <Tabs items={ITEMS} value={mode} onValueChange={setMode} orientation="vertical" />
      </div>
      <PanelStatus>
        <span>{ITEMS.find((i) => i.value === mode)?.label}</span>
      </PanelStatus>
    </div>
  );
}

function Pad({ children }: { children: React.ReactNode }) {
  return <div className="h-full overflow-auto p-3">{children}</div>;
}
