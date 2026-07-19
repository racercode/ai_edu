import type { Chapter } from "@/types/contracts";

export const chapter: Chapter = {
  id: "triangle-area",
  title: "Triangle Area",
  subject: "Mathematics",
  learningObjectives: [
    "Explain why triangle area is half of a matching parallelogram",
    "Identify the perpendicular height for a chosen base",
    "Calculate triangle area"
  ],
  blocks: [
    {
      id: "intro",
      type: "heading",
      content: "Area of a Triangle",
      conceptIds: ["triangle_area_formula"],
      order: 1
    },
    {
      id: "parallelogram-explanation",
      type: "paragraph",
      content:
        "Two identical triangles can be arranged to form a parallelogram with the same base and perpendicular height.",
      conceptIds: ["triangle_area_formula"],
      order: 2
    },
    {
      id: "formula-area",
      type: "formula",
      content: "A = 1/2 x base x height",
      conceptIds: ["triangle_area_formula", "height_is_perpendicular"],
      order: 3
    },
    {
      id: "height-definition",
      type: "paragraph",
      content:
        "The height is the perpendicular distance from the chosen base to the opposite vertex. It forms a 90-degree angle with the base.",
      conceptIds: ["height_is_perpendicular"],
      order: 4
    },
    {
      id: "worked-example",
      type: "example",
      content:
        "If the base is 8 cm and the perpendicular height is 5 cm, the area is 1/2 x 8 x 5 = 20 square centimeters.",
      conceptIds: ["triangle_area_formula", "height_is_perpendicular"],
      order: 5
    }
  ],
  quizzes: [
    {
      id: "quiz-height",
      afterBlockId: "height-definition",
      conceptIds: ["height_is_perpendicular"],
      question: "Which segment should be used as the height?",
      options: [
        "Any side connected to the top vertex",
        "The segment perpendicular to the chosen base",
        "Always the longest side",
        "Half of the base"
      ],
      correctOptionIndex: 1,
      explanation: "Height must be perpendicular to the selected base.",
      misconceptionByOption: {
        0: "Student used a slanted side as the height.",
        2: "Student assumes height means longest side.",
        3: "Student confused height with a formula operation."
      }
    },
    {
      id: "quiz-area",
      afterBlockId: "worked-example",
      conceptIds: ["triangle_area_formula"],
      question: "A triangle has base 10 cm and perpendicular height 6 cm. What is its area?",
      options: ["16 square centimeters", "30 square centimeters", "60 square centimeters", "120 square centimeters"],
      correctOptionIndex: 1,
      explanation: "Use 1/2 x 10 x 6 = 30."
    }
  ]
};
