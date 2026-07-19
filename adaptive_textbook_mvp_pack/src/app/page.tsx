"use client";

import {
  BookOpen,
  MessageSquarePlus,
  MousePointer2,
  RotateCcw,
  Sparkles,
  UsersRound
} from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";

type PeerNote = {
  author: string;
  body: string;
  kind: "student" | "ai" | "misconception";
};

type DemoStage =
  | "ready-for-quiz"
  | "wrong-answer"
  | "jumped-to-concept"
  | "ai-remediated"
  | "peer-note-added";

type AiRevealStep = 0 | 1 | 2 | 3 | 4;
type RewriteMode = "idle" | "deleting" | "typing" | "done";

const demoFlow = {
  questionId: "boundary-evidence",
  correctAnswerId: "A",
  wrongAnswerId: "B",
  targetConceptTitle: "從海底擴張到板塊構造",
  misconception: "你把「海底擴張」理解成只有岩漿把海床往兩側推開，忽略了磁條帶、地震帶與海溝一起指向板塊邊界。",
  originalConceptText: "海洋地殼在中洋脊形成後，會向兩側移動，並成為海底擴張的重要證據。",
  personalizedConceptText:
    "海洋地殼在中洋脊形成後會向兩側移動；但它不是無限制累積，而是在海溝附近隱沒回地函，形成「生成到回收」的板塊循環。",
  aiNoteTitle: "AI 補強筆記：板塊是一個循環系統",
  aiNoteBody:
    "請把海底擴張想成板塊運動的一段證據鏈：中洋脊產生新的海洋地殼，磁條帶記錄兩側對稱的擴張歷史；地震與火山集中在邊界，說明板塊不是只往外推，而是在另一端隱沒、回收。答題時看到「只形成、不回收」或「只和海底有關」通常就是錯誤選項。",
  studentReflection:
    "我原本以為中洋脊一直製造新的海床就能解釋板塊移動，但現在知道還要連到海溝隱沒與地震火山帶，才是完整的板塊構造觀念。"
} as const;

const initialPeerNotes: PeerNote[] = [
  {
    author: "同學 A",
    kind: "student",
    body: "我把它記成「中洋脊新增、海溝回收」。這樣比較不會只想到海底擴張，忘記板塊還有隱沒。"
  },
  {
    author: "同學 B",
    kind: "student",
    body: "磁條帶是關鍵證據，因為它像海床的時間軸，可以看出中洋脊兩側是對稱地往外移動。"
  }
];

const quizOptions = [
  {
    id: "A",
    label: "板塊邊界同時包含新地殼生成與舊地殼隱沒，能解釋磁條帶、地震與火山的分布。"
  },
  {
    id: "B",
    label: "海底擴張只表示岩漿在中洋脊不斷堆高，所以海洋地殼會永久增加，不需要隱沒。"
  },
  {
    id: "C",
    label: "板塊運動主要由潮汐造成，因此地震與火山應平均分布在各大洋中央。"
  },
  {
    id: "D",
    label: "磁條帶只反映海水鹽度變化，和海底擴張或板塊移動沒有直接關係。"
  }
];

export default function StudentTextbookPrototype() {
  const conceptRef = useRef<HTMLElement | null>(null);
  const revealTimersRef = useRef<number[]>([]);
  const [stage, setStage] = useState<DemoStage>("ready-for-quiz");
  const [peerNotes, setPeerNotes] = useState(initialPeerNotes);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [highlightConcept, setHighlightConcept] = useState(false);
  const [aiNoteVisible, setAiNoteVisible] = useState(false);
  const [aiRevealStep, setAiRevealStep] = useState<AiRevealStep>(0);
  const [rewriteMode, setRewriteMode] = useState<RewriteMode>("idle");
  const [conceptText, setConceptText] = useState(demoFlow.originalConceptText);
  const [selectionPanelVisible, setSelectionPanelVisible] = useState(false);

  const isWrongAnswer = selectedAnswerId === demoFlow.wrongAnswerId && showAnswer;
  const isCorrectAnswer = selectedAnswerId === demoFlow.correctAnswerId && showAnswer;
  const peerNoteAdded = stage === "peer-note-added";

  const statusText = useMemo(() => {
    if (stage === "peer-note-added") return "下一位學生可看到新增共筆與常見錯誤觀念";
    if (aiRevealStep === 4) return "AI 已完成補強：螢光重點與專屬筆記已加入教材";
    if (aiRevealStep === 3) return "AI 正在把改寫後的重點標成螢光";
    if (aiRevealStep === 2) return rewriteMode === "deleting" ? "AI 正在刪除容易誤解的教材表述" : "AI 正在逐字加入你的補強版本";
    if (aiRevealStep === 1) return "AI 正在分析答錯原因與對應觀念";
    if (stage === "wrong-answer") return "已偵測錯答，請跳回對應觀念";
    return "學生正在閱讀完整章節並準備作答";
  }, [aiRevealStep, rewriteMode, stage]);

  function clearRevealTimers() {
    revealTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    revealTimersRef.current = [];
  }

  function resetDemo() {
    clearRevealTimers();
    setStage("ready-for-quiz");
    setPeerNotes(initialPeerNotes);
    setSelectedAnswerId(null);
    setShowAnswer(false);
    setHighlightConcept(false);
    setAiNoteVisible(false);
    setAiRevealStep(0);
    setRewriteMode("idle");
    setConceptText(demoFlow.originalConceptText);
    setSelectionPanelVisible(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submitWrongAnswer() {
    clearRevealTimers();
    setSelectedAnswerId(demoFlow.wrongAnswerId);
    setShowAnswer(true);
    setStage("wrong-answer");
    setAiRevealStep(0);
    setHighlightConcept(false);
    setAiNoteVisible(false);
    setRewriteMode("idle");
    setConceptText(demoFlow.originalConceptText);
    setSelectionPanelVisible(false);
  }

  function queueReveal(callback: () => void, delay: number) {
    const timer = window.setTimeout(callback, delay);
    revealTimersRef.current.push(timer);
  }

  function animateConceptRewrite(startDelay: number) {
    const originalChars = Array.from(demoFlow.originalConceptText);
    const personalizedChars = Array.from(demoFlow.personalizedConceptText);
    const deleteSpeed = 28;
    const typeSpeed = 34;
    const deleteDuration = originalChars.length * deleteSpeed;
    const typeStart = startDelay + deleteDuration + 320;
    const typeDuration = personalizedChars.length * typeSpeed;

    queueReveal(() => {
      setAiRevealStep(2);
      setRewriteMode("deleting");
    }, startDelay);

    originalChars.forEach((_, index) => {
      queueReveal(() => {
        setConceptText(originalChars.slice(0, originalChars.length - index - 1).join(""));
      }, startDelay + (index + 1) * deleteSpeed);
    });

    queueReveal(() => setRewriteMode("typing"), typeStart - 120);

    personalizedChars.forEach((_, index) => {
      queueReveal(() => {
        setConceptText(personalizedChars.slice(0, index + 1).join(""));
      }, typeStart + (index + 1) * typeSpeed);
    });

    queueReveal(() => {
      setRewriteMode("done");
      setAiRevealStep(3);
      setHighlightConcept(true);
    }, typeStart + typeDuration + 320);

    queueReveal(() => {
      setAiRevealStep(4);
      setHighlightConcept(true);
      setAiNoteVisible(true);
      setStage("ai-remediated");
    }, typeStart + typeDuration + 1700);
  }

  function jumpToTargetConcept() {
    clearRevealTimers();
    setStage("jumped-to-concept");
    setAiRevealStep(0);
    setHighlightConcept(false);
    setAiNoteVisible(false);
    setRewriteMode("idle");
    setConceptText(demoFlow.originalConceptText);
    setSelectionPanelVisible(false);

    conceptRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

    queueReveal(() => setAiRevealStep(1), 650);
    animateConceptRewrite(1850);
  }

  function addStudentPeerNote() {
    setPeerNotes((current) => [
      ...current,
      {
        author: "你的共筆",
        kind: "ai",
        body: demoFlow.studentReflection
      },
      {
        author: "AI 常見錯誤觀念",
        kind: "misconception",
        body: "常見錯誤：只記得中洋脊會產生新海床，卻忘記海溝隱沒會回收舊海床，因此無法把海底擴張連到完整的板塊構造。"
      }
    ]);
    setStage("peer-note-added");
    setSelectionPanelVisible(false);
  }

  return (
    <main className="studentScene">
      <div className="bookChrome">
        <div className="readerTop">
          <span className="courseLabel">
            <BookOpen size={18} /> 高中地球科學・學生閱讀頁
          </span>
          <span className="readingState">{statusText}</span>
          <button className="quietReset" onClick={resetDemo} type="button" aria-label="重播 demo">
            <RotateCcw size={18} />
          </button>
        </div>

        <article className="textbookPage">
          <header className="chapterHeader">
            <p>第 4 章・動態的地球</p>
            <h1>板塊構造與海底擴張</h1>
            <div className="chapterMeta">
              <span>4-2</span>
              <span>觀念建構</span>
              <span>學生個人化教材</span>
            </div>
          </header>

          <section className="sectionBody">
            <h2>一、從海底擴張到板塊構造</h2>
            <p>
              二十世紀中葉，科學家利用聲納繪製海底地形，發現大洋中央存在連續的中洋脊。中洋脊附近熱流量高、火山活動旺盛，顯示地函物質可能在此上升並形成新的海洋地殼。
            </p>
            <p>
              海底岩石保留了地磁方向。當地球磁場反轉時，新形成的玄武岩會記錄當時的磁場方向，因此中洋脊兩側出現對稱的磁條帶。這項證據支持「海底擴張」：新的海洋地殼在中洋脊形成，並逐漸向兩側移動。
            </p>

            <section
              ref={conceptRef}
              className={`conceptBox ${highlightConcept ? "highlightedConcept highlightPulse" : ""}`}
            >
              <div className="conceptTitleRow">
                <strong>{demoFlow.targetConceptTitle}</strong>
                <PeerMarker notes={peerNotes} />
              </div>
              <p>
                海底擴張並不是孤立的現象。若新的海洋地殼持續生成，地球表面面積卻沒有增加，代表某些地方必須同時發生舊地殼的回收。
                <TextHighlight active={highlightConcept} mode={rewriteMode}>
                  {conceptText}
                </TextHighlight>
                這些證據把中洋脊、海溝、地震帶與火山帶連成一個整體，形成今日的板塊構造學說。
              </p>
              <p>
                因此，判斷題目時不能只背「中洋脊會形成新海床」，還要同時追蹤板塊邊界的完整循環：生成、移動、隱沒與回收。
              </p>

              {aiRevealStep >= 1 ? (
                <aside className={`aiDiagnosis ${aiRevealStep === 1 ? "thinkingCard" : "revealCard"}`}>
                  <span className="noteMark">
                    <Sparkles size={15} /> AI 觀念診斷
                  </span>
                  <h3>你錯在把「海底擴張」看成單一步驟</h3>
                  <p>{demoFlow.misconception}</p>
                  {aiRevealStep < 3 ? (
                    <div className="thinkingDots" aria-label="AI 正在分析">
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : (
                    <div className="noteReason">
                      補強方向：把「中洋脊生成新地殼」和「海溝隱沒回收舊地殼」合併成一條證據鏈。
                    </div>
                  )}
                </aside>
              ) : null}
            </section>

            {aiNoteVisible ? (
              <aside className="personalNote generatedNote">
                <span className="noteMark">
                  <Sparkles size={15} /> 已動態加入教材
                </span>
                <h3>{demoFlow.aiNoteTitle}</h3>
                <p>{demoFlow.aiNoteBody}</p>
                <div className="studentReflectionBox">
                  <strong>你的心得草稿</strong>
                  <p>{demoFlow.studentReflection}</p>
                  <button
                    className="inlineAiButton strong"
                    data-testid="add-peer-note"
                    onClick={() => setSelectionPanelVisible(true)}
                    type="button"
                  >
                    <MessageSquarePlus size={16} /> 在這裡新增共筆
                  </button>
                </div>
                {selectionPanelVisible ? (
                  <div className="selectionPanel">
                    <div>
                      <b>新增到共筆</b>
                      <p>系統會把你的心得與 AI 整理的常見錯誤觀念附在這個段落旁，下一位學生閱讀時可直接參考。</p>
                    </div>
                    <button className="inlineAiButton strong" onClick={addStudentPeerNote} type="button">
                      <UsersRound size={16} /> 發布共筆
                    </button>
                  </div>
                ) : null}
                {peerNoteAdded ? (
                  <div className="peerAddedHint">
                    已加入段落旁的共筆標記。Demo 下一步可把滑鼠移到「共筆」上，展示下一位學生看到的重點與常見錯誤觀念。
                  </div>
                ) : null}
              </aside>
            ) : null}

            <h2>二、板塊邊界的類型</h2>
            <p>
              板塊邊界依運動方向可分為張裂型、聚合型與錯動型。張裂型邊界常見於中洋脊；聚合型邊界常伴隨隱沒作用、深源地震與火山弧；錯動型邊界則以水平錯移為主。
            </p>
            <div className="tableScroller">
              <table className="comparisonTable">
                <thead>
                  <tr>
                    <th>邊界類型</th>
                    <th>主要運動</th>
                    <th>常見地形</th>
                    <th>地質現象</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>張裂型</th>
                    <td>板塊彼此遠離</td>
                    <td>中洋脊、裂谷</td>
                    <td>淺源地震、玄武岩質火山活動</td>
                  </tr>
                  <tr>
                    <th>聚合型</th>
                    <td>板塊彼此接近</td>
                    <td>海溝、火山弧、造山帶</td>
                    <td>淺至深源地震、安山岩質火山活動</td>
                  </tr>
                  <tr>
                    <th>錯動型</th>
                    <td>板塊水平錯移</td>
                    <td>轉形斷層</td>
                    <td>淺源地震頻繁</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="challengeSection">
            <h2>章末練習</h2>
            <div className="quizBlock" id={demoFlow.questionId}>
              <p className="quizLabel">概念題・板塊構造證據</p>
              <h3>下列哪一項最能完整說明「海底擴張」如何支持板塊構造學說？</h3>
              <div className="practiceOptions">
                {quizOptions.map((option) => {
                  const isSelected = selectedAnswerId === option.id;
                  const isCorrect = showAnswer && option.id === demoFlow.correctAnswerId;
                  const isWrong = showAnswer && option.id === demoFlow.wrongAnswerId && isSelected;

                  return (
                    <button
                      key={option.id}
                      className={`practiceOption ${isSelected ? "selected" : ""} ${isCorrect ? "correct" : ""} ${
                        isWrong ? "wrong" : ""
                      }`}
                      onClick={() => setSelectedAnswerId(option.id)}
                      type="button"
                    >
                      <span>{option.id}</span>
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <button className="demoWrongButton" data-testid="demo-wrong-answer" onClick={submitWrongAnswer} type="button">
                Demo：學生選錯答案
              </button>

              {isWrongAnswer ? (
                <div className="answerPanel wrong">
                  <h4>答錯了。正確答案是 A</h4>
                  <p>
                    B 選項只描述「新海床生成」，卻忽略舊海洋地殼會在海溝隱沒回收，因此無法完整解釋地球表面面積維持與地震火山分布。
                  </p>
                  <button className="jumpButton" data-testid="jump-concept" onClick={jumpToTargetConcept} type="button">
                    <MousePointer2 size={15} /> 跳到對應觀念
                  </button>
                </div>
              ) : null}

              {isCorrectAnswer ? (
                <div className="answerPanel correct">
                  <h4>答對了</h4>
                  <p>你已經能把海底擴張、磁條帶、隱沒作用與板塊邊界連在一起。</p>
                </div>
              ) : null}
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}

function TextHighlight({
  active,
  mode,
  children
}: {
  active: boolean;
  mode: RewriteMode;
  children: ReactNode;
}) {
  const className = [
    "rewritableText",
    mode === "deleting" ? "deletingText" : "",
    mode === "typing" ? "typingText" : "",
    active ? "highlightText highlightSweep" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={className}>{children}</span>;
}

function PeerMarker({ notes }: { notes: PeerNote[] }) {
  return (
    <button className="peerMarker" data-testid="peer-marker" type="button">
      <UsersRound size={15} />
      共筆 {notes.length}
      <span className="peerPopover">
        <strong className="popoverTitle">其他同學對這個觀念的整理</strong>
        <span className="peerNoteList">
          {notes.map((note, index) => (
            <span className={`peerNoteItem ${note.kind}`} key={`${note.author}-${index}`}>
              <b>{note.author}</b>
              <span>{note.body}</span>
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}
