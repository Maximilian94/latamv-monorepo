export interface Question {
    id: number;
    label: string;
    value: string;
    options: {
        id: number;
        label: string;
        value: string;
    }[];
    correctOption: number;
    selectedOption: number | null;
}