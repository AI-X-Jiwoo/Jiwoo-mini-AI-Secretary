import requests
import json
import os
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer, util
from langchain.chat_models import ChatOpenAI
import re


# .env 파일 로드
load_dotenv()



# API 키 설정
api_key = os.getenv("KSTARTUP_API_TOKEN")

# chatGPT 키 설정 
chatgpt_key = os.getenv("OPEN_AI_API_KEY")

# API 엔드포인트 설정
url = 'http://apis.data.go.kr/B552735/kisedKstartupService/getAnnouncementInformation'

title = ''
content = ''
regine=''

# API 요청 파라미터 설정
params = {'serviceKey' : api_key,
          'pageNo':'1',
          'numOfRows': '10',
          'cond[biz_pbanc_nm::LIKE]' : title,
          'cond[pbanc_ctnt::LIKE]' : content,
          'cond[supt_regin::LIKE]': regine,
          'cond[rcrt_prgs_yn::EQ]':'Y',
          'returnType':'json'
          }

# API 요청 보내기
response = requests.get(url, params=params)

# 응답 상태 코드 확인
if response.status_code == 200:
    try:
        # JSON 데이터 파싱
        data = response.json()
        # print(json.dumps(data, indent=4, ensure_ascii=False))
        announcements = data.get('data',[])
        # print(announcements)
    except json.JSONDecodeError:
        print("응답 본문이 JSON 형식이 아닙니다.")
        announcement=[]
else:
    print(f"API 요청 실패: {response.status_code}")
    print(response.text)
    announcements = []

# AI 모델 설정 
model = SentenceTransformer('xlm-r-100langs-bert-base-nli-stsb-mean-tokens')

# 검색할 키워드
search_keyword = '비건'

# # 타이틀 임베딩 생성
# title_embedding = model.encode('', convert_to_tensor=True)

# 검색 키워드 임베딩 생성
search_embedding = model.encode(search_keyword, convert_to_tensor=True)

# 유사도 계산 및 결과 저장
results = []

# 데이터베이스에 데이터 삽입 및 유사도 계산
for announcement in announcements :
    announcement_title = announcement.get('biz_pbanc_nm', '')
    announcement_content = announcement.get('pbanc_ctnt', '')
    announcement_url = announcement.get('detl_pg_url', '')

    # 제목과 내용 결합
    combined_text = announcement_title + " " + announcement_content

    # 내용 임베딩 생성
    content_embedding = model.encode(combined_text, convert_to_tensor=True)

    # 유사도 계산
    similarity = util.pytorch_cos_sim(search_embedding, content_embedding).item()
    percentage = (similarity + 1) / 2 * 100     # 유사도를 백분율로 전환

#     print(f"Title: {announcement_title}")
#     print(f"Content: {announcement_content}")
#     print(f"URL: {announcement_url}")
#     print(f"Relatedness: {percentage:.2f}%")
#     print("\n")

    # 결과 저장
    results.append({
        'title': announcement_title,
        'content': announcement_content,
        'url': announcement_url,
        'similarity':percentage
    })


# 유사도 높은 기준으로 정렬 (상위 5개)
results_count = 5
results = sorted(results, key=lambda x: x['similarity'], reverse=True)[:results_count]

# 결과 출력
for result in results:
    print(f"Title: {result['title']}")
    print(f"Content: {result['content']}")
    print(f"URL: {result['url']}")
    print(f"Relatedness: {result['similarity']:.2f}%")
    print("\n")



# ChatGPT 요청
chat_model = ChatOpenAI(api_key=chatgpt_key)

prompt = f"다음 {results_count}개의 사업이 {search_keyword}에 어떤 이익을 줄지 각각 예측해줘. {results}"
print(prompt)
gpt_result = chat_model.predict(prompt)

# GPT 응답을 각 사업에 매핑
gpt_responses = gpt_result.split('\n\n')
for i, response in enumerate(gpt_responses):
    if i < len(results):
        # 순번 & 타이틀 제거
        title = results[i]['title']
        cleaned_response = re.sub(r'^\d+\.\s*', '', response) # 순번 제거
        cleaned_response = re.sub(re.escape(title) + r'\s*:\s*', '', cleaned_response) # 타이틀 제거 
        # ^\d+\.\s* : 문자열 시작(`^`)에서 숫자(`\d+`), 점(`\,`), 공백(`\s*`) 제거
        # re.escape(title) : 정규표현식에서 타이틀을 안전하게 사용할수있도록 함
        # \s*:\s* : 공백, 콜론 제거
        results[i]['gpt_response'] = cleaned_response

# print(gpt_result)

# 최종 결과 반환
print(json.dumps(results, indent=4, ensure_ascii=False))

