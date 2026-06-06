import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/quiz/$lessonId")({
  component: QuizPage,
});

function QuizPage() {
  const { lessonId } = Route.useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [lesson, setLesson] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate({ to: "/login" }); return; }
      setUserId(session.user.id);
      const { data: lessonData } = await supabase
        .from("lessons").select("*, modules(course_id)").eq("id", lessonId).single();
      setLesson(lessonData);
      const { data: qs } = await supabase
        .from("quiz_questions").select("*").eq("lesson_id", lessonId).order("sort_order");
      setQuestions(qs ?? []);
    });
  }, [lessonId, navigate]);

  const submit = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast.error("সব প্রশ্নের উত্তর দিন");
      return;
    }
    let s = 0;
    questions.forEach((q) => { if (answers[q.id] === q.correct_answer) s++; });
    setScore(s);
    setSubmitted(true);
    await supabase.from("quiz_attempts").insert({
      user_id: userId, lesson_id: lessonId, score: s, total: questions.length,
      answers: questions.map((q) => ({ question_id: q.id, selected: answers[q.id] })),
    });
  };

  if (!lesson) return <div className="flex min-h-screen flex-col"><Navbar /><div className="flex-1 py-20 text-center text-muted-foreground">লোড হচ্ছে...</div></div>;

  const courseId = lesson.modules?.course_id;

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
          <p className="text-center text-muted-foreground">এই লেসনে কোনো কুইজ নেই।</p>
          {courseId && (
            <div className="mt-4 text-center">
              <Link to="/learn/$courseId" params={{ courseId }}><Button variant="outline"><ArrowLeft className="mr-1 h-4 w-4" />কোর্সে ফিরুন</Button></Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="mb-1 text-2xl font-bold">কুইজ: {lesson.title}</h1>
        <p className="mb-6 text-sm text-muted-foreground">মোট প্রশ্ন: {questions.length}</p>

        {submitted && (
          <Card className="mb-6 border-primary/40 bg-primary/5">
            <CardContent className="p-6 text-center">
              <h2 className="mb-2 text-xl font-bold">আপনার স্কোর</h2>
              <p className="text-3xl font-bold text-primary">{score} / {questions.length}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {score === questions.length ? "চমৎকার! সব উত্তর সঠিক।" : score >= questions.length / 2 ? "ভালো করেছেন।" : "আবার চেষ্টা করুন।"}
              </p>
              {courseId && (
                <Link to="/learn/$courseId" params={{ courseId }} className="mt-4 inline-block">
                  <Button><ArrowLeft className="mr-1 h-4 w-4" />কোর্সে ফিরুন</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {questions.map((q, qi) => {
            const opts = Array.isArray(q.options) ? q.options : [];
            return (
              <Card key={q.id}>
                <CardHeader>
                  <CardTitle className="text-base">{qi + 1}. {q.question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {opts.map((opt: string, i: number) => {
                    const selected = answers[q.id] === i;
                    const isCorrect = submitted && i === q.correct_answer;
                    const isWrong = submitted && selected && i !== q.correct_answer;
                    return (
                      <button
                        key={i}
                        disabled={submitted}
                        onClick={() => setAnswers({ ...answers, [q.id]: i })}
                        className={`flex w-full items-center gap-2 rounded-md border p-3 text-left text-sm transition-colors ${
                          isCorrect ? "border-green-500 bg-green-50 dark:bg-green-950/20" :
                          isWrong ? "border-red-500 bg-red-50 dark:bg-red-950/20" :
                          selected ? "border-primary bg-primary/10" : "hover:bg-accent"
                        }`}
                      >
                        {submitted && isCorrect && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {submitted && isWrong && <XCircle className="h-4 w-4 text-red-600" />}
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!submitted && (
          <Button className="mt-6 w-full" size="lg" onClick={submit}>উত্তর জমা দিন</Button>
        )}
      </div>
    </div>
  );
}
