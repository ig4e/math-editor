// API keys section — one card per registered provider, plus a single
// catch-all card for the OpenAI-compatible adapter that lets the user
// pre-fill from a preset (DeepSeek / Qwen / Moonshot / Zhipu / ...).
//
// Keys land via byok.saveProviderKey, which encrypts with the per-install
// salt before stashing in IndexedDB. The Verify button calls the provider
// adapter's verify() — a cheap ping that surfaces auth errors fast.

import { useState } from 'react';
import { useStore } from '../../state/store';
import {
  getAllProviders, OPENAI_COMPAT_PRESETS,
} from '../../ai/providers';
import { saveProviderKey, removeProviderKey, hasProviderKey } from '../../ai/byok';
import {
  Card, Button, Input, Select, Field, Banner, Spinner,
} from '../../components/common';
import { Icon } from '../../components/Icons';
import '../../ai/providers/index';

export function APIKeysSection() {
  const providers = getAllProviders();
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Banner kind="info" title="Local-only, encrypted at rest">
        Keys live in your browser's IndexedDB, encrypted with a per-install AES-GCM key.
        Nothing leaves this device unless you initiate an AI call. See <a href="/docs/ai-byok.md" className="underline">docs/ai-byok.md</a>.
      </Banner>

      {providers
        .filter((p) => p.info.id !== 'openai-compat')
        .map((p) => <ProviderCard key={p.info.id} provider={p} />)}

      <CompatCard />
    </div>
  );
}

function ProviderCard({ provider }: { provider: ReturnType<typeof getAllProviders>[number] }) {
  const has = hasProviderKey(provider.info.id);
  return (
    <Card title={provider.info.label}>
      <KeyForm
        providerId={provider.info.id}
        defaultModel={provider.info.models[0]}
        models={provider.info.models}
        baseURLField={false}
      />
      {has && (
        <div className="mt-2 flex items-center gap-2 text-xs text-fg-muted">
          <Icon name="check" className="text-success" /> Key stored
          <span className="flex-1" />
          <Button size="sm" variant="ghost" onClick={() => removeProviderKey(provider.info.id)}>
            Remove
          </Button>
        </div>
      )}
    </Card>
  );
}

function CompatCard() {
  const [preset, setPreset] = useState<string>('deepseek');
  const matched = OPENAI_COMPAT_PRESETS.find((p) => p.id === preset);
  return (
    <Card title="OpenAI-compatible (DeepSeek / Qwen / Moonshot / Zhipu / …)" tone="accent">
      <Field label="Preset" inline>
        {() => (
          <Select
            value={preset}
            onValueChange={setPreset}
            items={OPENAI_COMPAT_PRESETS.map((p) => ({ value: p.id, label: p.label, description: p.baseURL }))}
            ariaLabel="OpenAI-compatible preset"
          />
        )}
      </Field>
      <div className="mt-2">
        <KeyForm
          providerId="openai-compat"
          defaultBaseURL={matched?.baseURL}
          defaultModel={matched?.defaultModel}
          baseURLField={true}
          models={[]}
          presetKey={preset}
        />
      </div>
    </Card>
  );
}

interface KeyFormProps {
  providerId: string;
  defaultModel?: string;
  defaultBaseURL?: string;
  models: readonly string[];
  baseURLField: boolean;
  presetKey?: string;
}

function KeyForm({ providerId, defaultModel, defaultBaseURL, models, baseURLField, presetKey }: KeyFormProps) {
  const toast = useStore((s) => s.toast);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(defaultModel ?? '');
  const [baseURL, setBaseURL] = useState(defaultBaseURL ?? '');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; reason?: string } | null>(null);

  // Reset when the preset changes
  if (defaultBaseURL && baseURL === '' ) {
    setBaseURL(defaultBaseURL);
  }

  const save = async () => {
    if (!apiKey) { toast('Paste a key first', 'warn'); return; }
    setBusy(true);
    setResult(null);
    try {
      // Verify before storing — bad key shouldn't end up in IDB.
      const { getProvider } = await import('../../ai/providers');
      const provider = getProvider(providerId);
      if (!provider) {
        setResult({ ok: false, reason: 'Provider not registered' });
        return;
      }
      const v = await provider.verify({ apiKey, baseURL: baseURLField ? baseURL : undefined });
      if (!v.ok) {
        setResult(v);
        return;
      }
      await saveProviderKey({
        providerId,
        apiKey,
        model: model || undefined,
        baseURL: baseURLField ? baseURL : undefined,
      });
      setApiKey('');
      setResult({ ok: true });
      toast(`${providerId} key saved`, 'success');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {baseURLField && (
        <Field label="Base URL" inline key={`baseurl-${presetKey}`}>
          {() => (
            <Input value={baseURL} onChange={(e) => setBaseURL(e.currentTarget.value)} placeholder="https://api.example.com" />
          )}
        </Field>
      )}
      <Field label="API key" inline>
        {() => (
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.currentTarget.value)}
            placeholder="paste your key"
            className="flex-1 min-w-0 font-mono"
          />
        )}
      </Field>
      {models.length > 0 && (
        <Field label="Default model" inline>
          {() => (
            <Select
              value={model}
              onValueChange={setModel}
              items={models.map((m) => ({ value: m, label: m }))}
              ariaLabel="Default model"
            />
          )}
        </Field>
      )}
      {!models.length && (
        <Field label="Default model" inline>
          {() => (
            <Input value={model} onChange={(e) => setModel(e.currentTarget.value)} placeholder="e.g. deepseek-chat" />
          )}
        </Field>
      )}
      <div className="flex items-center gap-2 mt-1">
        <Button size="sm" variant="primary" onClick={() => void save()} disabled={busy}>
          {busy ? <Spinner size="sm" /> : <Icon name="check" />} Verify & save
        </Button>
        {result?.ok && <span className="text-xs text-success">✓ saved</span>}
        {result && !result.ok && <span className="text-xs text-danger">{result.reason}</span>}
      </div>
    </div>
  );
}
