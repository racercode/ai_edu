"use client";

import {
  BookOpen,
  CheckCircle2,
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

type DemoFlow = {
  questionId: "boundary-evidence";
  correctAnswerId: "A";
  wrongAnswerId: "B";
  targetConceptTitle: string;
  misconception: string;
  highlightText: string;
  aiNoteTitle: string;
  aiNoteBody: string;
  studentReflection: string;
};

const demoFlow: DemoFlow = {
  questionId: "boundary-evidence",
  correctAnswerId: "A",
  wrongAnswerId: "B",
  targetConceptTitle: "核心概念：海底擴張與張裂型邊界",
  misconception: "常見錯誤觀念：把「海溝、板塊靠近、隱沒」的聚合型特徵，套用到中洋脊與海底擴張的情境。",
  highlightText: "中洋脊附近的岩漿上升並冷卻，會形成新的海洋地殼；岩石年齡會由中洋脊向兩側逐漸變老。",
  aiNoteTitle: "AI 個人化筆記：看到中洋脊，先想到張裂",
  aiNoteBody:
    "這題答錯的關鍵不是名詞記不熟，而是證據鏈接錯。若題目出現中洋脊、淺源地震、岩石年齡由中心向兩側變老，代表兩側板塊正在遠離，岩漿上升形成新的海洋地殼，因此應判斷為張裂型邊界。聚合型邊界才常與海溝、隱沒帶和較深震源有關。",
  studentReflection:
    "我的理解：看到中洋脊和岩石年齡往兩側變老，要先判斷是新的海洋地殼在中間生成，所以是張裂型邊界，不是聚合型。"
};

const initialPeerNotes: PeerNote[] = [
  {
    author: "同學 A",
    kind: "student",
    body: "我把這段理解成：地震不是隨機分布，而是沿著板塊交界排成帶狀，所以可以反推板塊邊界。"
  },
  {
    author: "同學 B",
    kind: "student",
    body: "中洋脊的重點是「新的海洋地殼在中間生成」，所以岩石年齡會從中間往兩側變老。"
  }
];

const quizOptions = [
  {
    id: "A",
    label: "張裂型邊界，因為板塊彼此遠離，岩漿上升並形成新的海洋地殼。"
  },
  {
    id: "B",
    label: "聚合型邊界，因為板塊彼此靠近，海洋地殼會隱沒到地函中。"
  },
  {
    id: "C",
    label: "錯動型邊界，因為板塊水平滑移，所以岩石年齡會對稱分布。"
  },
  {
    id: "D",
    label: "板塊內部，因為地震只集中在海洋地殼中央，不代表板塊邊界。"
  }
];

export default function StudentTextbookPrototype() {
  const conceptRef = useRef<HTMLElement | null>(null);
  const [stage, setStage] = useState<DemoStage>("ready-for-quiz");
  const [peerNotes, setPeerNotes] = useState(initialPeerNotes);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [highlightConcept, setHighlightConcept] = useState(false);
  const [aiNoteVisible, setAiNoteVisible] = useState(false);
  const [peerNoteAdded, setPeerNoteAdded] = useState(false);

  const isWrong = selectedAnswerId !== null && selectedAnswerId !== demoFlow.correctAnswerId;
  const status = useMemo(() => {
    const labels: Record<DemoStage, string> = {
      "ready-for-quiz": "已讀完整章，開始做題",
      "wrong-answer": "答錯，AI 顯示解析與章節連結",
      "jumped-to-concept": "已跳到對應觀念",
      "ai-remediated": "AI 已畫重點並修改教材",
      "peer-note-added": "心得已加入共筆，下一位學生可查看"
    };
    return labels[stage];
  }, [stage]);

  function resetDemo() {
    setStage("ready-for-quiz");
    setPeerNotes(initialPeerNotes);
    setSelectedAnswerId(null);
    setHighlightConcept(false);
    setAiNoteVisible(false);
    setPeerNoteAdded(false);
  }

  function answerQuestion(optionId: string) {
    setSelectedAnswerId(optionId);
    setStage(optionId === demoFlow.correctAnswerId ? "ready-for-quiz" : "wrong-answer");
  }

  function demoAnswerWrongQuestion() {
    answerQuestion(demoFlow.wrongAnswerId);
    window.setTimeout(() => {
      document.getElementById(demoFlow.questionId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  }

  function jumpToTargetConcept() {
    conceptRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setStage("jumped-to-concept");

    window.setTimeout(() => {
      analyzeMisconceptionAndModifyTextbook();
    }, 700);
  }

  function analyzeMisconceptionAndModifyTextbook() {
    setHighlightConcept(true);
    setAiNoteVisible(true);
    setStage("ai-remediated");
  }

  function addReflectionToPeerNotes() {
    if (peerNoteAdded) return;

    setPeerNotes((current) => [
      ...current,
      {
        author: "我",
        kind: "student",
        body: demoFlow.studentReflection
      },
      {
        author: "AI 整理",
        kind: "ai",
        body: "這位學生的關鍵整理是：中洋脊代表張裂與新海洋地殼生成；海溝與隱沒才較常對應聚合型邊界。"
      },
      {
        author: "常見錯誤",
        kind: "misconception",
        body: demoFlow.misconception
      }
    ]);
    setPeerNoteAdded(true);
    setStage("peer-note-added");
  }

  return (
    <main className="studentScene">
      <section className="bookChrome" aria-label="學生閱讀畫面">
        <div className="readerTop">
          <div className="courseLabel">
            <BookOpen size={18} />
            高中地球科學 2
          </div>
          <div className="readingState">{status}</div>
          <button className="quietReset" type="button" onClick={resetDemo} title="重置 demo">
            <RotateCcw size={16} />
          </button>
        </div>

        <article className="textbookPage">
          <header className="pageHeader">
            <p>第二章 地球內部與板塊運動</p>
            <h1>板塊構造學說：從全球地震帶到板塊邊界</h1>
            <div className="orangeRule" />
          </header>

          <section className="learningGoals">
            <h2>學習目標</h2>
            <p>完成本節後，你應能：</p>
            <ol>
              <li>說明全球地震、火山與造山活動的分布如何支持板塊構造學說。</li>
              <li>比較張裂型、聚合型與錯動型板塊邊界的相對運動、受力與地形特徵。</li>
              <li>根據震源深度、岩石類型與地質構造，推論未知地區的板塊邊界類型。</li>
            </ol>
          </section>

          <TextSection title="一、從海底擴張到板塊構造">
            <p>
              20 世紀中期，科學家利用全球地震觀測網累積大量資料後，發現地震並非平均散布於地球表面，
              而是集中成數條狹長、近乎連續的地震帶。
              <PeerMarker notes={peerNotes} />
              其中最明顯的包括環太平洋地震帶、歐亞地震帶與中洋脊地震帶。
            </p>
            <p>
              這些地震帶與全球火山帶大致重合，也常沿著中洋脊、海溝、島弧及大型山脈分布。這項空間上的一致性暗示：
              地震、火山與造山活動不是彼此獨立的事件，而可能由同一套地球內部作用所控制。
            </p>
          </TextSection>

          <section
            ref={conceptRef}
            className={`conceptBox ${highlightConcept ? "highlightedConcept" : ""}`}
            id="concept-seafloor-spreading"
          >
            <div className="conceptTitleRow">
              <strong>{demoFlow.targetConceptTitle}</strong>
            </div>
            <p>
              <span className={highlightConcept ? "highlightText" : ""}>{demoFlow.highlightText}</span>
              這代表中洋脊兩側的板塊正在彼此遠離，因此中洋脊常被視為張裂型邊界的重要證據。
            </p>
          </section>

          {stage === "jumped-to-concept" || stage === "ai-remediated" || stage === "peer-note-added" ? (
            <section className="aiDiagnosis" aria-live="polite">
              <div className="noteMark">
                <Sparkles size={17} />
                AI 分析你的觀念錯在哪
              </div>
              <h3>需要補強：海底擴張與張裂型邊界</h3>
              <p>{demoFlow.misconception}</p>
            </section>
          ) : null}

          {aiNoteVisible ? (
            <section className="personalNote" aria-live="polite">
              <div className="noteMark">
                <Sparkles size={17} />
                AI 動態修改教材內容
              </div>
              <h3>{demoFlow.aiNoteTitle}</h3>
              <p>{demoFlow.aiNoteBody}</p>
              <div className="studentReflectionBox">
                <strong>我的心得</strong>
                <p>{demoFlow.studentReflection}</p>
                <button className="inlineAiButton strong" type="button" onClick={addReflectionToPeerNotes}>
                  <MessageSquarePlus size={16} />
                  新增到共筆
                </button>
              </div>
              {peerNoteAdded ? (
                <p className="peerAddedHint">已加入共筆。下一位學生讀到這個段落時，可以 hover 共筆標記看到你的心得、AI 整理與常見錯誤觀念。</p>
              ) : null}
            </section>
          ) : null}

          <TextSection title="二、板塊是什麼？">
            <p>
              板塊構造學說認為，地球外層並非完整的一整片，而是由多個板塊拼合而成。板塊的主體是堅硬的岩石圈，
              包含地殼與最上部地函；板塊則浮載並移動於較具可塑性的軟流圈之上。
            </p>
            <ul className="textbookList">
              <li>
                <b>張裂型邊界：</b>板塊彼此遠離，常見於中洋脊，岩漿上升後冷卻形成新的海洋地殼。
              </li>
              <li>
                <b>聚合型邊界：</b>板塊彼此靠近，可能形成隱沒帶、海溝、島弧或褶皺山脈。
              </li>
              <li>
                <b>錯動型邊界：</b>板塊沿水平方向錯移，常伴隨淺源地震與大型斷層。
              </li>
            </ul>
          </TextSection>

          <section className="quizBlock" id={demoFlow.questionId}>
            <p className="quizLabel">讀完整章後的練習題</p>
            <h2>根據證據判斷板塊邊界</h2>
            <p className="questionPrompt">
              某海域中央有連續海底山脈，附近出現淺源地震，且岩石年齡由山脈中心向兩側逐漸變老。
              這最可能是哪一種板塊邊界？
            </p>
            <div className="practiceOptions">
              {quizOptions.map((option) => {
                const isSelected = selectedAnswerId === option.id;
                const isCorrect = option.id === demoFlow.correctAnswerId;
                return (
                  <button
                    className={[
                      "practiceOption",
                      isSelected ? "selected" : "",
                      selectedAnswerId && isCorrect ? "correct" : "",
                      selectedAnswerId && isSelected && !isCorrect ? "wrong" : ""
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    disabled={selectedAnswerId !== null}
                    key={option.id}
                    onClick={() => answerQuestion(option.id)}
                    type="button"
                  >
                    <span>{option.id}</span>
                    {option.label}
                  </button>
                );
              })}
            </div>

            {selectedAnswerId === null ? (
              <button className="demoWrongButton" type="button" onClick={demoAnswerWrongQuestion}>
                Demo：學生選錯答案 B
              </button>
            ) : (
              <section className={isWrong ? "answerPanel wrong" : "answerPanel correct"} aria-live="polite">
                <h3>{isWrong ? "答錯了。正確答案是 A：張裂型邊界。" : "答對了。"}</h3>
                <p>
                  題目中的「中洋脊、淺源地震、岩石年齡由中心向兩側變老」是一組張裂型邊界證據，
                  表示板塊彼此遠離並形成新的海洋地殼。
                </p>
                <button className="jumpButton" type="button" onClick={jumpToTargetConcept}>
                  <MousePointer2 size={16} />
                  跳到對應觀念
                </button>
              </section>
            )}
          </section>

          <section className="readingHint">
            <CheckCircle2 size={18} />
            <p>
              下一位學生讀到本段落時，只要把滑鼠移到共筆標記上，就能看到其他同學心得、AI 整理與常見錯誤觀念。
            </p>
          </section>
        </article>
      </section>
    </main>
  );
}

function TextSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="textbookSection">
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function PeerMarker({ notes }: { notes: PeerNote[] }) {
  return (
    <span className="peerMarker" tabIndex={0}>
      <UsersRound size={14} />
      共筆
      <span className="peerPopover" role="tooltip">
        <span className="popoverTitle">這個觀念的共筆與常見錯誤</span>
        <span className="peerNoteList">
          {notes.map((note, index) => (
            <span className={`peerNoteItem ${note.kind}`} key={`${note.author}-${index}`}>
              <b>{note.author}</b>
              <span>{note.body}</span>
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}
