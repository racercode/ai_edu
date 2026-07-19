import type { Chapter } from "@/types/contracts";

export const demoChapter: Chapter = { id: "triangle-area", title: "三角形的面積", subject: "數學", learningObjectives: ["解釋三角形面積為何是相同平行四邊形的一半", "辨識相對於底邊的垂直高", "計算三角形面積"], blocks: [
  { id: "intro", type: "heading", content: "三角形的面積", conceptIds: ["triangle_area_formula"], order: 1 },
  { id: "parallelogram-explanation", type: "paragraph", content: "兩個全等三角形可以拼成一個底和垂直高相同的平行四邊形。", conceptIds: ["triangle_area_formula"], order: 2 },
  { id: "formula-area", type: "formula", content: "面積 = 1/2 × 底 × 高", conceptIds: ["triangle_area_formula", "height_is_perpendicular"], order: 3 },
  { id: "height-definition", type: "paragraph", content: "高是從選定的底邊到對面頂點的垂直距離，必須和底邊形成 90 度。", conceptIds: ["height_is_perpendicular"], order: 4 }
], quizzes: [
  { id: "quiz-height", afterBlockId: "height-definition", conceptIds: ["height_is_perpendicular"], question: "哪一條線段可以當作這個三角形相對於底邊的高？", options: ["連接頂點的任意一條邊", "與選定底邊垂直的線段", "最長的一條邊", "底邊的一半"], correctOptionIndex: 1, explanation: "高必須與選定的底邊垂直。", misconceptionByOption: { "0": "學生把斜邊當成高。", "2": "學生以為高一定是最長邊。", "3": "學生把高和公式運算混淆。" } },
  { id: "quiz-calculate", afterBlockId: "formula-area", conceptIds: ["triangle_area_formula"], question: "底為 8 公分、高為 5 公分的三角形，面積是多少平方公分？", options: ["13", "20", "40", "80"], correctOptionIndex: 1, explanation: "1/2 × 8 × 5 = 20。", misconceptionByOption: { "2": "學生忘了除以二。" } }
] };
