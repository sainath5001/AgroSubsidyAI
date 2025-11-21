import { Hero } from "../components/Hero";
import { ProblemSolution } from "../components/ProblemSolution";
import { WorkflowTimeline } from "../components/WorkflowTimeline";
import { DashboardShowcase } from "../components/DashboardShowcase";
import { ImpactStats } from "../components/ImpactStats";
import { CallToAction } from "../components/CallToAction";
import { AutonomousWorkflow } from "../components/AutonomousWorkflow";

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <Hero />
      <AutonomousWorkflow />
      <ProblemSolution />
      <WorkflowTimeline />
      <DashboardShowcase />
      <ImpactStats />
      <CallToAction />
    </main>
  );
}
