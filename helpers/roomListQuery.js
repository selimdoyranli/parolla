/** Strapi sort for the quiz list's sort pick (quizzes page + party add-game dialog). */
export const roomSortParam = sort => {
  if (sort === 'oldest') return 'createdAt:asc'

  if (sort === 'byViewCount') return 'viewCount:desc'

  return 'createdAt:desc'
}

/** Adds the quiz-kind filter; same split as QuizTypeLabel, old rows have no quizType and count as plain qa quizzes. */
export const applyQuizKindFilter = (query, kind) => {
  if (kind === 'choices' || kind === 'flashcards') {
    query['filters[quizType][$eq]'] = kind
  } else if (kind) {
    query['filters[$or][0][quizType][$eq]'] = 'qa'
    query['filters[$or][1][quizType][$null]'] = true
    query['filters[questionTypeDominance][$eq]'] = kind === 'media' ? 'media' : 'text'

    if (kind !== 'media') {
      query['filters[answerTypeDominance][$eq]'] = kind === 'trivia' ? 'trivia' : 'textField'
    }
  }

  return query
}
