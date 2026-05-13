// Lazy TFJS wrapper. Importing this module triggers the ~400 KB
// `@tensorflow/tfjs` dynamic chunk. `@tensorflow/tfjs` lives under
// optionalDependencies so self-hosters can `npm i --omit=optional`;
// if the package is missing we surface a friendly error.

export interface TrainPoint { x: number; y: number }

export interface TrainOpts {
  /** Hidden-layer widths. [] = pure linear model. */
  hidden: readonly number[];
  /** Total epochs. */
  epochs: number;
  /** Learning rate (Adam). */
  learningRate: number;
  /** Callback after every epoch with (epoch, loss). */
  onEpoch?(epoch: number, loss: number): void;
  /** Optional abort signal — training loop stops on next epoch. */
  signal?: AbortSignal;
}

export interface TrainResult {
  weights: number[][];     // per-layer flat weights (W concatenated with b)
  finalLoss: number;
  predict(x: number): number;
}

export async function trainScalar(points: readonly TrainPoint[], opts: TrainOpts): Promise<TrainResult> {
  // Resolve TFJS lazily. The runtime error if the optional dep is
  // missing is friendlier than the default module-not-found stack.
  let tf: typeof import('@tensorflow/tfjs');
  try {
    tf = await import('@tensorflow/tfjs');
  } catch (e) {
    throw new Error(
      'TensorFlow.js is not installed. Run `npm install @tensorflow/tfjs` ' +
      'or re-install without --omit=optional. (' + (e as Error).message + ')',
    );
  }

  const xsArr = points.map((p) => p.x);
  const ysArr = points.map((p) => p.y);
  const xs = tf.tensor2d(xsArr.map((x) => [x]));
  const ys = tf.tensor2d(ysArr.map((y) => [y]));

  const model = tf.sequential();
  if (opts.hidden.length === 0) {
    model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
  } else {
    model.add(tf.layers.dense({ units: opts.hidden[0]!, inputShape: [1], activation: 'tanh' }));
    for (let i = 1; i < opts.hidden.length; i++) {
      model.add(tf.layers.dense({ units: opts.hidden[i]!, activation: 'tanh' }));
    }
    model.add(tf.layers.dense({ units: 1 }));
  }
  model.compile({ optimizer: tf.train.adam(opts.learningRate), loss: 'meanSquaredError' });

  let lastLoss = NaN;
  await model.fit(xs, ys, {
    epochs: opts.epochs,
    verbose: 0,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        const l = Number(logs?.loss ?? NaN);
        lastLoss = l;
        opts.onEpoch?.(epoch, l);
        if (opts.signal?.aborted) {
          model.stopTraining = true;
        }
      },
    },
  });

  // Flatten weights for inspection.
  const weights: number[][] = [];
  for (const w of model.getWeights()) {
    weights.push(Array.from(w.dataSync()));
  }

  const predict = (x: number): number => {
    const t = tf.tensor2d([[x]]);
    const y = (model.predict(t) as import('@tensorflow/tfjs').Tensor).dataSync();
    t.dispose();
    return y[0]!;
  };

  xs.dispose();
  ys.dispose();
  return { weights, finalLoss: lastLoss, predict };
}
