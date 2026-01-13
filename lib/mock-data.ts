import { BlogPost } from "./types";

export const mockPosts: BlogPost[] = [
  {
    id: "1",
    slug: "future-of-ai-agents",
    title: "The Future of AI Agents: Autonomous Systems in 2026",
    excerpt: "Exploring how AI agents are revolutionizing automation and decision-making across industries.",
    author: "Sarah Chen",
    publishedAt: "2026-01-10",
    readTime: "8 min read",
    tags: ["AI", "Automation", "Future Tech"],
    content: {
      blocks: [
        {
          type: "header",
          data: {
            text: "The Future of AI Agents: Autonomous Systems in 2026",
            level: 1,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "Artificial Intelligence agents have evolved from simple chatbots to sophisticated autonomous systems capable of complex decision-making. In 2026, we're witnessing a paradigm shift in how these agents interact with our digital and physical worlds.",
          },
        },
        {
          type: "header",
          data: {
            text: "What Are AI Agents?",
            level: 2,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "AI agents are autonomous software entities that can perceive their environment, make decisions, and take actions to achieve specific goals. Unlike traditional software, they can learn from experience and adapt their behavior over time.",
          },
        },
        {
          type: "list",
          data: {
            style: "unordered",
            items: [
              "Autonomous decision-making capabilities",
              "Learning from interactions and feedback",
              "Multi-modal understanding (text, vision, audio)",
              "Goal-oriented behavior",
              "Adaptive responses to changing environments",
            ],
          },
        },
        {
          type: "header",
          data: {
            text: "Key Applications",
            level: 2,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "The applications of AI agents span across numerous industries, transforming how we work and live:",
          },
        },
        {
          type: "list",
          data: {
            style: "ordered",
            items: [
              "Healthcare: Diagnostic assistants and patient monitoring systems",
              "Finance: Automated trading and risk assessment",
              "Customer Service: Intelligent support agents with emotional intelligence",
              "Manufacturing: Predictive maintenance and quality control",
              "Education: Personalized learning companions",
            ],
          },
        },
        {
          type: "quote",
          data: {
            text: "The most profound technologies are those that disappear. They weave themselves into the fabric of everyday life until they are indistinguishable from it.",
            caption: "Mark Weiser, Computer Scientist",
          },
        },
        {
          type: "header",
          data: {
            text: "Technical Architecture",
            level: 2,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "Modern AI agents are built on sophisticated architectures that combine multiple AI technologies:",
          },
        },
        {
          type: "code",
          data: {
            code: `class AIAgent:
    def __init__(self, model, memory, tools):
        self.model = model
        self.memory = memory
        self.tools = tools
    
    def perceive(self, environment):
        """Gather information from environment"""
        return self.model.process(environment)
    
    def decide(self, perception):
        """Make decisions based on perception"""
        context = self.memory.retrieve_relevant(perception)
        return self.model.reason(perception, context)
    
    def act(self, decision):
        """Execute actions using available tools"""
        return self.tools.execute(decision)`,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "This architecture enables agents to operate in a continuous loop of perception, decision-making, and action, constantly learning and improving their performance.",
          },
        },
        {
          type: "header",
          data: {
            text: "Challenges and Considerations",
            level: 2,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "While AI agents offer tremendous potential, they also present significant challenges that we must address:",
          },
        },
        {
          type: "list",
          data: {
            style: "unordered",
            items: [
              "Safety and alignment: Ensuring agents act in accordance with human values",
              "Transparency: Making agent decisions interpretable and explainable",
              "Privacy: Protecting sensitive data in agent interactions",
              "Accountability: Determining responsibility for agent actions",
              "Bias mitigation: Preventing discriminatory behavior",
            ],
          },
        },
        {
          type: "header",
          data: {
            text: "Looking Ahead",
            level: 2,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "The future of AI agents is incredibly promising. As these systems become more sophisticated, we'll see them taking on increasingly complex tasks, working alongside humans as true collaborators rather than mere tools. The key to success will be developing these technologies responsibly, with a focus on human benefit and safety.",
          },
        },
      ],
    },
  },
  {
    id: "2",
    slug: "llm-breakthrough-2026",
    title: "Major Breakthrough in Large Language Models",
    excerpt: "New research reveals significant improvements in reasoning capabilities and efficiency.",
    author: "Michael Rodriguez",
    publishedAt: "2026-01-08",
    readTime: "6 min read",
    tags: ["LLM", "Research", "NLP"],
    content: {
      blocks: [
        {
          type: "header",
          data: {
            text: "Major Breakthrough in Large Language Models",
            level: 1,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "Researchers have achieved a significant breakthrough in large language model architecture, dramatically improving both reasoning capabilities and computational efficiency. This advancement could reshape the landscape of AI applications.",
          },
        },
        {
          type: "header",
          data: {
            text: "The Innovation",
            level: 2,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "The new architecture, dubbed 'Adaptive Reasoning Transformer' (ART), introduces dynamic computation allocation that allows the model to dedicate more resources to complex reasoning tasks while maintaining efficiency on simpler queries.",
          },
        },
        {
          type: "quote",
          data: {
            text: "This represents a fundamental shift in how we approach language model design. We're no longer bound by the one-size-fits-all approach.",
            caption: "Dr. Emily Watson, Lead Researcher",
          },
        },
        {
          type: "header",
          data: {
            text: "Key Improvements",
            level: 2,
          },
        },
        {
          type: "list",
          data: {
            style: "unordered",
            items: [
              "40% improvement in complex reasoning tasks",
              "60% reduction in computational costs for simple queries",
              "Better handling of multi-step logical problems",
              "Improved factual accuracy and reduced hallucinations",
              "Enhanced context understanding over longer sequences",
            ],
          },
        },
        {
          type: "paragraph",
          data: {
            text: "These improvements make advanced AI capabilities more accessible and sustainable, potentially democratizing access to powerful language models.",
          },
        },
      ],
    },
  },
  {
    id: "3",
    slug: "ai-ethics-framework",
    title: "New AI Ethics Framework Adopted by Tech Giants",
    excerpt: "Industry leaders come together to establish comprehensive guidelines for responsible AI development.",
    author: "Jennifer Park",
    publishedAt: "2026-01-05",
    readTime: "5 min read",
    tags: ["Ethics", "Policy", "Industry"],
    content: {
      blocks: [
        {
          type: "header",
          data: {
            text: "New AI Ethics Framework Adopted by Tech Giants",
            level: 1,
          },
        },
        {
          type: "paragraph",
          data: {
            text: "In a historic move, leading technology companies have jointly adopted a comprehensive AI ethics framework that sets new standards for responsible AI development and deployment.",
          },
        },
        {
          type: "header",
          data: {
            text: "Core Principles",
            level: 2,
          },
        },
        {
          type: "list",
          data: {
            style: "ordered",
            items: [
              "Transparency: Clear disclosure of AI system capabilities and limitations",
              "Fairness: Active measures to prevent bias and discrimination",
              "Privacy: Strong data protection and user consent mechanisms",
              "Accountability: Clear responsibility chains for AI decisions",
              "Safety: Rigorous testing and monitoring protocols",
            ],
          },
        },
        {
          type: "paragraph",
          data: {
            text: "This framework represents a significant step forward in ensuring AI technologies benefit society while minimizing potential harms.",
          },
        },
      ],
    },
  },
];

export function getAllPosts(): BlogPost[] {
  return mockPosts;
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return mockPosts.find((post) => post.slug === slug);
}

export function getRecentPosts(limit: number = 3): BlogPost[] {
  return mockPosts.slice(0, limit);
}
