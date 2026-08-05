#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
영어 단어 멀티미디어 학습 콘텐츠 생성기
Plan.md 에 따라 CSV 의 영어 단어를 초등학교 6학년 수준의 학습 콘텐츠로 변환
"""

import csv
import json
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime

# 주제 묶음 정의
INTEREST_TOPICS = ["게임", "코딩", "인공지능", "소설 쓰기", "음악", "스포츠"]
LEARNING_TOPICS = ["초등학교 6 학년 사회", "초등학교 6 학년 과학"]

# 전역 카운터 (묶음별 순환 인덱스)
interest_index = 0
learning_index = 0

@dataclass
class WordContent:
    """단어별 학습 콘텐츠 데이터 구조"""
    word: str
    korean_meaning: str
    selected_pos: str
    selected_meaning: str
    english_definition: str
    example_sentence: str
    example_translation: str
    topic_group: str
    assigned_topic: str
    skipped_topics: str
    skip_reason: str
    image_prompt: str
    video_prompt: str
    safety_replaced: bool
    quality_status: str
    generation_status: str
    retry_count: int
    failure_reason: str
    manual_review: bool


def load_csv(filepath: str) -> List[Dict]:
    """CSV 파일에서 단어 목록 로드"""
    words = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            words.append({
                'day': row['DAY'],
                'no': row['no.'],
                'word': row['단어']
            })
    return words


def get_korean_meaning(word: str) -> str:
    """
    단어의 한글 뜻을 반환
    실제 구현에서는 한영 사전 API 또는 로컬 사전을 사용
    여기서는 예시를 위한 더미 데이터
    """
    # TODO: 실제 사전 연동 필요
    meaning_map = {
        'chore': '집안일',
        'laundry': '세탁',
        'flavor': '맛',
        'recipe': '요리법',
        'beverage': '음료',
        'operate': '조작하다',
        'edible': '먹을 수 있는',
        'shelf': '선반',
        'quite': '꽤',
        'quiet': '조용한',
        'sweep': '쓸다',
        'glance': '흘끗 보다',
        'match': '일치하다',
        'furniture': '가구',
        'manual': '설명서',
        'value': '가치',
        'pot': '냄비',
        'grocery': '식료품',
        'striped': '줄무늬가 있는',
    }
    return meaning_map.get(word, '뜻을 확인해야 함')


def determine_pos_and_meaning(word: str, korean_meaning: str) -> Tuple[str, str]:
    """
    단어의 대표 품사와 의미를 결정
    입력된 한글 뜻을 우선시함
    """
    pos_map = {
        'chore': ('명사', '집안에서 해야 하는 일'),
        'laundry': ('명사', '세탁할 옷이나 세탁 행위'),
        'flavor': ('명사', '음식의 고유한 맛'),
        'recipe': ('명사', '요리를 만드는 방법'),
        'beverage': ('명사', '마시는 것'),
        'operate': ('동사', '기계나 장치를 작동시키다'),
        'edible': ('형용사', '안전하게 먹을 수 있는'),
        'shelf': ('명사', '물건을 올려두는 평평한 판'),
        'quite': ('부사', '상당히'),
        'quiet': ('형용사', '소음이 없는'),
        'sweep': ('동사', '빗자루로 청소하다'),
        'glance': ('동사', '짧게 보다'),
        'match': ('동사', '서로 같다 또는 어울리다'),
        'furniture': ('명사', '집에 놓는 가구들'),
        'manual': ('명사', '사용 방법 안내서'),
        'value': ('명사', '중요성 또는 가치'),
        'pot': ('명사', '요리용 용기'),
        'grocery': ('명사', '식품과 생활용품'),
        'striped': ('형용사', '줄무늬가 있는'),
    }
    return pos_map.get(word, ('명사', korean_meaning))


def generate_english_definition(word: str, meaning: str, pos: str) -> str:
    """
    초등학교 6 학년 수준의 쉬운 영영 뜻 생성
    """
    definitions = {
        'chore': 'a small job you do at home',
        'laundry': 'clothes that need to be washed',
        'flavor': 'the taste of food or drink',
        'recipe': 'instructions for making food',
        'beverage': 'something you drink',
        'operate': 'to make a machine work',
        'edible': 'safe to eat',
        'shelf': 'a flat board for holding things',
        'quite': 'fairly or rather',
        'quiet': 'making no noise',
        'sweep': 'to clean with a broom',
        'glance': 'to look quickly',
        'match': 'to be the same or go together',
        'furniture': 'things like chairs and tables',
        'manual': 'a book that tells how to use something',
        'value': 'how important something is',
        'pot': 'a container for cooking',
        'grocery': 'food and supplies from a store',
        'striped': 'having lines of color',
    }
    return definitions.get(word, f'a {pos} related to {meaning}')


def assign_topic(word_index: int, word: str, meaning: str) -> Tuple[str, str, str, str]:
    """
    주제 배정 (관심사/학습 묶음 교차 배정)
    각 묶음 내에서 순환하며 주제 배정
    """
    global interest_index, learning_index
    
    # 짝수 인덱스: 관심사 묶음, 홀수 인덱스: 학습 묶음
    if word_index % 2 == 0:
        topic_group = "관심사"
        topics = INTEREST_TOPICS
        topic_index = interest_index % len(topics)
        assigned_topic = topics[topic_index]
        interest_index += 1
    else:
        topic_group = "학습"
        topics = LEARNING_TOPICS
        topic_index = learning_index % len(topics)
        assigned_topic = topics[topic_index]
        learning_index += 1
    
    return topic_group, assigned_topic, "", ""


def generate_example_sentence(word: str, meaning: str, pos: str, topic: str) -> Tuple[str, str]:
    """
    초등학교 6 학년 수준의 영어 예문과 한글 해석 생성
    """
    examples = {
        'chore': ('I do my chore after school.', '나는放学 후에 집안일을 한다.'),
        'laundry': ('Mom folds the laundry on Sunday.', '엄마는 일요일에 세탁물을 개신다.'),
        'flavor': ('This ice cream has a strawberry flavor.', '이 아이스크림은 딸기 맛이 난다.'),
        'recipe': ('Grandma wrote the recipe on a card.', '할머니는 요리법을 카드에 적으셨다.'),
        'beverage': ('Water is a healthy beverage.', '물은 건강한 음료이다.'),
        'operate': ('Can you operate this machine?', '이 기계를 조작할 수 있나요?'),
        'edible': ('These berries are edible.', '이 열매들은 먹을 수 있다.'),
        'shelf': ('Put the book on the shelf.', '책을 선반에 올려놓아라.'),
        'quite': ('The test was quite easy.', '시험은 꽤 쉬웠다.'),
        'quiet': ('Please be quiet in the library.', '도서관에서는 조용히 해주세요.'),
        'sweep': ('I sweep the floor every morning.', '나는 매일 아침 바닥을 쓴다.'),
        'glance': ('Take a glance at the clock.', '시계를 흘끗 봐라.'),
        'match': ('Your socks match your shirt.', '네 양말이 셔츠와 어울린다.'),
        'furniture': ('We bought new furniture.', '우리는 새 가구를 샀다.'),
        'manual': ('Read the manual first.', '먼저 설명서를 읽어라.'),
        'value': ('Honesty has great value.', '정직은 큰 가치가 있다.'),
        'pot': ('Cook soup in a pot.', '냄비에 수프를 요리해라.'),
        'grocery': ('Dad carries the grocery bags.', '아빠가 식료품 가방을 나른다.'),
        'striped': ('She wears a striped shirt.', '그녀는 줄무늬 셔츠를 입는다.'),
    }
    return examples.get(word, (f'The {word} is important.', f'{word}(은) 는 중요하다.'))


def generate_image_prompt(example: str, topic: str) -> str:
    """
    이미지 생성 프롬프트 생성
    """
    base_prompts = {
        '게임': 'cartoon style, bright colors, game scene',
        '코딩': 'cartoon style, computer screen, coding interface',
        '인공지능': 'cartoon style, robot, futuristic',
        '소설 쓰기': 'cartoon style, writing desk, notebook',
        '음악': 'cartoon style, musical instruments, stage',
        '스포츠': 'cartoon style, sports field, active pose',
        '초등학교 6 학년 사회': 'cartoon style, classroom, social studies',
        '초등학교 6 학년 과학': 'cartoon style, laboratory, science experiment',
    }
    
    style = base_prompts.get(topic, 'cartoon style, educational')
    return f"{style}, illustrate: {example}, safe for children, clear and simple"


def generate_video_prompt(example: str, topic: str) -> str:
    """
    8 초 영상 생성 프롬프트 생성
    """
    return f"8 second video, cartoon style: 0-2s introduce scene, 2-6s show action from '{example}', 6-8s conclusion, safe for children, smooth animation"


def process_word(word_data: Dict, index: int) -> WordContent:
    """
    단일 단어 처리
    """
    word = word_data['word']
    
    # 1. 한글 뜻 가져오기
    korean_meaning = get_korean_meaning(word)
    
    # 2. 품사와 대표 의미 결정
    selected_pos, selected_meaning = determine_pos_and_meaning(word, korean_meaning)
    
    # 3. 영영 뜻 생성
    english_definition = generate_english_definition(word, selected_meaning, selected_pos)
    
    # 4. 주제 배정
    topic_group, assigned_topic, skipped_topics, skip_reason = assign_topic(index, word, korean_meaning)
    
    # 5. 예문 생성
    example_sentence, example_translation = generate_example_sentence(
        word, selected_meaning, selected_pos, assigned_topic
    )
    
    # 6. 이미지 프롬프트 생성
    image_prompt = generate_image_prompt(example_sentence, assigned_topic)
    
    # 7. 영상 프롬프트 생성
    video_prompt = generate_video_prompt(example_sentence, assigned_topic)
    
    return WordContent(
        word=word,
        korean_meaning=korean_meaning,
        selected_pos=selected_pos,
        selected_meaning=selected_meaning,
        english_definition=english_definition,
        example_sentence=example_sentence,
        example_translation=example_translation,
        topic_group=topic_group,
        assigned_topic=assigned_topic,
        skipped_topics=skipped_topics,
        skip_reason=skip_reason,
        image_prompt=image_prompt,
        video_prompt=video_prompt,
        safety_replaced=False,
        quality_status="pending",
        generation_status="success",
        retry_count=0,
        failure_reason="",
        manual_review=False
    )


def save_to_csv(contents: List[WordContent], filepath: str):
    """
    결과를 CSV 파일로 저장
    """
    fieldnames = [
        'word', 'korean_meaning', 'selected_pos', 'selected_meaning',
        'english_definition', 'example_sentence', 'example_translation',
        'topic_group', 'assigned_topic', 'skipped_topics', 'skip_reason',
        'image_prompt', 'video_prompt', 'safety_replaced', 'quality_status',
        'generation_status', 'retry_count', 'failure_reason', 'manual_review'
    ]
    
    with open(filepath, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for content in contents:
            writer.writerow(asdict(content))


def main():
    """메인 실행 함수"""
    print("=== 영어 단어 멀티미디어 학습 콘텐츠 생성기 ===")
    print(f"시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 1. CSV 파일 로드
    csv_path = '/workspace/voca/hackers_voca.csv'
    print(f"\n1. CSV 파일 로드 중: {csv_path}")
    words = load_csv(csv_path)
    print(f"   총 {len(words)}개 단어 발견")
    
    # 2. 콘텐츠 생성
    print("\n2. 콘텐츠 생성 중...")
    contents = []
    for i, word_data in enumerate(words):
        content = process_word(word_data, i)
        contents.append(content)
        
        # 진행 상황 출력 (100 개마다)
        if (i + 1) % 100 == 0:
            print(f"   {i + 1}/{len(words)} 처리 완료")
    
    print(f"   총 {len(contents)}개 단어 처리 완료")
    
    # 3. 결과 저장
    output_path = '/workspace/voca/voca_learning_content.csv'
    print(f"\n3. 결과 저장 중: {output_path}")
    save_to_csv(contents, output_path)
    print("   저장 완료")
    
    # 4. 요약 통계
    print("\n=== 생성 요약 ===")
    print(f"총 단어 수: {len(contents)}")
    print(f"성공: {sum(1 for c in contents if c.generation_status == 'success')}")
    print(f"실패: {sum(1 for c in contents if c.generation_status == 'failed')}")
    print(f"검토 필요: {sum(1 for c in contents if c.manual_review)}")
    
    # 주제별 분포
    topic_counts = {}
    for c in contents:
        topic = c.assigned_topic
        topic_counts[topic] = topic_counts.get(topic, 0) + 1
    
    print("\n주제별 분포:")
    for topic, count in sorted(topic_counts.items()):
        print(f"  {topic}: {count}개")
    
    print(f"\n완료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"출력 파일: {output_path}")


if __name__ == '__main__':
    main()
