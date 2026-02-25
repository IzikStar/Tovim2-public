import React from "react";
import { Card, CardContent } from "./ui/card";

interface Props {
  label: string;
  children: React.ReactNode;
}

const QuestionBlock: React.FC<Props> = ({ label, children }) => (
  <Card className="border-border/70 bg-card/95">
    <CardContent className="space-y-3 p-4 md:p-5">
      <label className="block text-sm font-bold text-foreground">{label}</label>
      <div className="space-y-2">{children}</div>
    </CardContent>
  </Card>
);

export default QuestionBlock;
