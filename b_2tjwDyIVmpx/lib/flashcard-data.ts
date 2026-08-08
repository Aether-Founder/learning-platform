export interface Question {
  id: string;
  number: string;
  text: string;
}

export interface FlashcardSection {
  id: string;
  timestamp: string;
  title: string;
  questions: Question[];
}

export const flashcardSections: FlashcardSection[] = [
  {
    id: 'batch-size',
    timestamp: '00:00:00',
    title: 'How batch size affects token cost and speed',
    questions: [
      {
        id: 'q1-1',
        number: '01',
        text: "Equation for time of one forward pass (hint — it's the result of two different quantities)",
      },
      {
        id: 'q1-2',
        number: '02',
        text: 'Equation for t_compute',
      },
      {
        id: 'q1-3',
        number: '03',
        text: "Equation for t_mem (hint — there's a contribution from the weights, and from the KV cache)",
      },
      {
        id: 'q1-4',
        number: '04',
        text: 'Sketch out (in your head) what the graph with batch size on the x-axis and latency on the y-axis looks like — draw the lines for t_compute, KV fetch, and weight fetch, then bold the line that corresponds to total latency given a certain batch size.',
      },
      {
        id: 'q1-5',
        number: '05',
        text: "Where does the lower bound on latency come from? Why can't you just keep decreasing batch size and have infinitesimal total time to process a token?",
      },
      {
        id: 'q1-6',
        number: '06',
        text: "Why doesn't the time cost of a token keep decreasing indefinitely as you increase batch size? What two things cannot be amortized over the batch?",
      },
      {
        id: 'q1-7',
        number: '07',
        text: 'On modern hardware, what is the typical ratio of FLOPs / memory bandwidth?',
      },
      {
        id: 'q1-8',
        number: '08',
        text: 'Work through the math that shows that optimal batch size ought to be at least 300× your sparsity ratio (active / total parameters) to maximize throughput. Ignore KV cache.',
      },
      {
        id: 'q1-9',
        number: '09',
        text: 'Picture a GPU cluster as a train station: every ~20ms, a "train" departs carrying a batch of sequences through one forward pass (producing one new token per sequence). Why 20ms specifically? What goes wrong if you schedule trains more frequently? How about less frequently?',
      },
    ],
  },
  {
    id: 'moe-layout',
    timestamp: '00:32:09',
    title: 'How MoE models are laid out across GPU racks',
    questions: [
      {
        id: 'q2-1',
        number: '01',
        text: 'Why is one rack a natural boundary for an MoE layer?',
      },
    ],
  },
  {
    id: 'pipeline-parallelism',
    timestamp: '00:47:12',
    title: 'How pipeline parallelism moves model layers across racks',
    questions: [
      {
        id: 'q3-1',
        number: '01',
        text: 'Why do "bubbles" emerge when pipeline parallelism is used during training?',
      },
      {
        id: 'q3-2',
        number: '02',
        text: "Why can't you overlap batches in training to solve pipeline bubbles?",
      },
      {
        id: 'q3-3',
        number: '03',
        text: "Pipeline parallelism across P stages divides model weights by P per device. Why doesn't it also divide the KV cache by P?",
      },
    ],
  },
  {
    id: 'ilya-quote',
    timestamp: '01:03:37',
    title: 'Why Ilya said, "As we now know, pipelining is not wise."',
    questions: [
      {
        id: 'q4-1',
        number: '01',
        text: 'Why did Ilya say, "As we now know, pipelining is not wise."',
      },
    ],
  },
  {
    id: 'rl-overtrained',
    timestamp: '01:18:59',
    title: 'Because of RL, models may be 100× over-trained beyond Chinchilla-optimal',
    questions: [
      {
        id: 'q5-1',
        number: '01',
        text: 'Where does the 6 in the 6ND pre-training FLOPs equation come from?',
      },
      {
        id: 'q5-2',
        number: '02',
        text: 'Write the equation for total compute cost across pre-training, RL, and inference.',
      },
      {
        id: 'q5-3',
        number: '03',
        text: 'Why might you naively expect C_pretrain = C_RL = C_inference?',
      },
      {
        id: 'q5-4',
        number: '04',
        text: 'Solve for D_pretrain = D_RL = D_inference, with ⅓ as much MFU from decode as prefill.',
      },
      {
        id: 'q5-5',
        number: '05',
        text: 'If a frontier model does 50M tokens/sec globally and is deployed for 2 months, using the analysis above, how many tokens should it be pretrained on?',
      },
      {
        id: 'q5-6',
        number: '06',
        text: 'The Chinchilla rule is that D_optimal ≈ 20 × N_active. If a frontier model has 100B active parameters and is pretrained on 200T tokens, how much over Chinchilla-optimal is it?',
      },
    ],
  },
  {
    id: 'api-pricing',
    timestamp: '01:33:02',
    title: 'Deducing inference memory costs from API pricing',
    questions: [
      {
        id: 'q6-1',
        number: '01',
        text: "Why does Gemini charge ~ 50% more for tokens above 200K context? At a high level, what's happening?",
      },
      {
        id: 'q6-2',
        number: '02',
        text: 'Sketch compute and memory time per token as context length increases. Then also sketch the pricing per token and how it changes at the crossover point.',
      },
      {
        id: 'q6-3',
        number: '03',
        text: "Given Gemini's 200K crossover, work out the implied bytes-per-token of KV cache. Assume 100B active parameters.",
      },
      {
        id: 'q6-4',
        number: '04',
        text: 'Output tokens are typically 3-5× more expensive than input tokens. What does that tell us? And why is that?',
      },
      {
        id: 'q6-5',
        number: '05',
        text: 'Why are cached input tokens (cache hits) ~ 10× cheaper than fresh input tokens?',
      },
    ],
  },
  {
    id: 'convergent-evolution',
    timestamp: '02:04:02',
    title: 'Convergent evolution between neural nets and cryptography',
    questions: [
      {
        id: 'q7-1',
        number: '01',
        text: "Why do cryptographic protocols have similar high-level architecture to neural networks, where they're basically jumbling information across many layers?",
      },
      {
        id: 'q7-2',
        number: '02',
        text: 'One could argue that NNs and cryptographic protocols use a similar high-level architecture to opposite ends. In what sense are they doing opposite things?',
      },
    ],
  },
];
