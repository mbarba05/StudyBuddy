import { colors } from "@/assets/colors";
import { BlueButton } from "@/components/ui/Buttons";
import { ReviewInput } from "@/components/ui/TextInputs";
import { gradeOptions } from "@/lib/enumFrontend";
import { ReviewableEnrollment } from "@/services/enrollmentService";
import { submitReview } from "@/services/reviewsService";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import StarRating from "react-native-star-rating-widget";
import { DifficultyIcon, ProfessorQualityIcon } from "./RatingIcons";

interface WriteReviewModalProps {
    visible: boolean;
    setVisible: (visible: boolean) => void;
    selectedEnrollment: ReviewableEnrollment;
    onSubmit: () => void;
}

const WriteReviewModal = ({ visible, setVisible, selectedEnrollment, onSubmit }: WriteReviewModalProps) => {
    const [reviewText, setReviewText] = useState("");
    const [courseDiff, setCourseDiff] = useState(5);
    const [profRating, setProfRating] = useState(5);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [gradeOpen, setGradeOpen] = useState(false);
    const [grade, setGrade] = useState<string>("");

    const validateInputs = () => {
        if (reviewText.trim().length === 0) {
            setError("Review text cannot be empty.");
            return false;
        } else if (!grade) {
            setError("Grade can't be empty.");
            return false;
        } else if (reviewText.length > 300) {
            setError("Review text cannot be longer than 300 chars.");
            return false;
        }
        return true;
    };

    const handleSubmitReview = async () => {
        if (!validateInputs()) return;

        setLoading(true);
        setError(null);

        try {
            const reviewInput = {
                enrollmentId: selectedEnrollment.enrollmentId,
                review: reviewText,
                grade,
                courseDiff,
                profRating,
            };
            const submitted = await submitReview(reviewInput);

            if (!submitted) {
                setError("Failed to submit review. Please try again later.");
                return;
            }
            onSubmit();
            modalClose();
        } catch (e) {
            console.error("Error submitting review:", e);
            setError("Failed to submit review. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const modalClose = () => {
        setReviewText("");
        setCourseDiff(5);
        setProfRating(5);
        setError(null);
        setVisible(false);
        setGrade("");
    };

    console.log("Selected Enrollment in Modal:", selectedEnrollment);

    if (!selectedEnrollment) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            allowSwipeDismissal
            presentationStyle="formSheet"
            onRequestClose={modalClose}
            backdropColor={colors.background}
        >
            <View className="flex-1 w-full items-center gap-4 bg-colors-background p-4">
                <View>
                    <View className="flex flex-row gap-1">
                        <Text className="text-4xl text-colors-text font-semibold text-center">Reviewing</Text>
                        <Ionicons
                            name="pencil"
                            size={28}
                            color={colors.text}
                        />
                    </View>
                    <Text className="text-2xl text-colors-text font-semibold text-center">
                        {selectedEnrollment.course.code}
                    </Text>
                    <Text className="text-2xl text-colors-text text-center font-semibold">
                        {selectedEnrollment.prof.name}
                    </Text>

                    <Text className="text-2xl text-colors-textSecondary font-semibold text-center">
                        {selectedEnrollment.term}
                    </Text>
                </View>
                <View className="w-[92.5vw]">
                    <Text className="text-lg text-colors-textSecondary">Review</Text>
                    <ReviewInput
                        placeholder="Talk about your time in the course, how you liked the professor, advice, etc."
                        value={reviewText}
                        onChangeText={(e) => setReviewText(e)}
                    />
                </View>
                <View>
                    <Text className="text-lg text-colors-textSecondary">Professor Quality</Text>
                    <View className="flex items-center mt-2">
                        <StarRating
                            rating={profRating}
                            onChange={setProfRating}
                            starSize={26}
                            maxStars={10}
                            enableHalfStar={false}
                            enableSwiping
                            StarIconComponent={ProfessorQualityIcon}
                        />
                    </View>
                </View>
                <View>
                    <Text className="text-lg text-colors-textSecondary">Course Difficulty</Text>
                    <View className="flex items-center mt-2">
                        <StarRating
                            rating={courseDiff}
                            onChange={setCourseDiff}
                            starSize={26}
                            maxStars={10}
                            enableHalfStar={false}
                            enableSwiping
                            StarIconComponent={DifficultyIcon}
                        />
                    </View>
                </View>
                <View>
                    <Text className="text-lg text-colors-textSecondary">Grade</Text>
                    <View className="flex items-center mt-2">
                        <DropDownPicker
                            open={gradeOpen}
                            value={grade}
                            items={gradeOptions}
                            setOpen={setGradeOpen}
                            setValue={setGrade}
                            //setItems={setMajorOptions}
                            placeholder="Choose Grade"
                            placeholderStyle={styles.placeholder}
                            textStyle={{
                                color: "white",
                                fontSize: 17,
                            }}
                            style={styles.dropdown}
                            dropDownContainerStyle={styles.dropdownContainer}
                            searchContainerStyle={styles.searchContainer}
                            listMode="SCROLLVIEW"
                        />
                    </View>
                </View>
                <View className="h-8">{error && <Text className="text-lg text-colors-error">{error}</Text>}</View>
                <View>
                    {loading ? <ActivityIndicator /> : <BlueButton onPress={handleSubmitReview}>Submit</BlueButton>}
                </View>
            </View>
        </Modal>
    );
};

export default WriteReviewModal;

const styles = StyleSheet.create({
    dropdown: {
        backgroundColor: "#002e6d",
        borderColor: colors.text,
    },
    placeholder: {
        color: colors.textSecondary,
    },
    dropdownContainer: {
        backgroundColor: colors.secondary,
        borderColor: colors.text,
    },
    searchContainer: {
        borderColor: colors.text,
    },
});
