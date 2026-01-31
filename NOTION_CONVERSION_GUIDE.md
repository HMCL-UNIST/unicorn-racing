# Notion to Jekyll Conversion Guide

This guide provides rules and best practices for converting Notion HTML exports to Jekyll blog posts for the UNICORN Racing website (Chirpy theme).

## 🎯 Quick Reference

When converting Notion content to Jekyll posts, **always follow these rules**:

1. ✅ **바로 수정하지 말 것** — 먼저 제목을 추천하고, 글 다듬기 여부를 물어본 뒤 수정
2. ✅ **작성자(author)를 반드시 물어볼 것**
3. ✅ **첫 번째 이미지**를 front matter의 `image: path:`로 대표 이미지 설정
4. ✅ **내부 포스트 링크**에는 `{{ site.baseurl }}` 사용 (이미지 경로에는 불필요)
5. ✅ **어투 통일**: `~했습니다`, `~됩니다` 체로 작성
6. ✅ **외부 URL**은 `[URL](URL)` 형식으로 클릭 가능하게 작성
7. ✅ Copy media files to appropriate folders in the project
8. ✅ Verify image filenames match markdown references

---

## 🔄 Conversion Workflow (Interactive)

Notion HTML을 변환할 때, **반드시 아래 순서를 따른다**:

### Step 1: HTML 읽기
```
Notion 내보내기 폴더에서 HTML 파일을 읽는다.
일반적인 경로: ~/Downloads/UUID_ExportBlock-.../...Part-1/개인 페이지 & 공유된 페이지/[페이지명]/
```

### Step 2: 작성자 확인 (필수)
**반드시 사용자에게 author를 물어본다.**
```
이 포스트의 작성자(author)는 누구인가요?
```
- `_data/authors.yml`에 등록된 이름을 사용한다
- 예: `hyeongjoon-yang`

### Step 3: 제목 추천 및 승인
**바로 변환하지 않는다.** 먼저 더 나은 제목을 추천한다.
- 문제 해결형: "VESC에서 Servo 출력이 안 나오는 경우"
- 방법 안내형: "VESC 내장 IMU를 ROS에서 사용하는 방법"
- 가이드형: "VESC 모터 회전 방향과 전류 설정 가이드"
- 튜닝형: "VESC PID Speed Controller 튜닝하는 방법"

```
제목을 "XXX"로 추천합니다. 글도 블로그 스타일로 다듬을까요?
```

### Step 4: 이미지 복사
- Notion 내보내기 폴더에서 이미지를 찾는다
- `/home/js/unicorn-racing/assets/img/posts/[post-slug]/`로 복사
- 파일명: 공백 제거, 하이픈 사용, 소문자

### Step 5: 포스트 작성
- 사용자 승인을 받은 제목으로 포스트 생성
- 어투를 `~했습니다`, `~됩니다`로 통일
- Chirpy prompt 블록 적절히 활용
- 관련 포스트 간 링크 연결

### Step 6: 검증
- 모든 이미지 파일이 존재하는지 확인
- 파일명이 markdown 참조와 일치하는지 확인

---

## 📁 File Structure

### Post Files
- **Location**: `/home/js/unicorn-racing/_posts/`
- **Naming**: `YYYY-MM-DD-title-in-lowercase.md`
  - Use hyphens (`-`) instead of spaces
  - Remove special characters except hyphens
  - Examples:
    - ✅ `2026-01-30-vesc-general-tab.md`
    - ✅ `2025-05-19-2025-icra-roboracer-2nd-place.md`
    - ❌ `2025-05-19-2025 ICRA RoboRacer 2nd Place.md`

### Image Files
- **Location**: `/home/js/unicorn-racing/assets/img/posts/[post-slug]/`
- **Naming**: Use hyphens instead of spaces
  - ✅ `image-1.png`, `result-graph.png`
  - ❌ `image 1.png`, `result graph.png`
- **Folder structure**:
  ```
  assets/img/posts/
  ├── vesc-firmware-upgrade/
  │   ├── vesc-tool-fw.png
  │   └── firmware-select.png
  ├── vesc-general-tab/
  │   └── general-tab.png
  ├── vesc-foc-tab/
  │   ├── sensor-mode.png
  │   └── detect-parameters.png
  └── ...
  ```

### Notion Export Folder Structure
Notion에서 내보낸 파일은 보통 아래 경로에 있다:
```
~/Downloads/[UUID]_ExportBlock-[UUID]/
  ExportBlock-[UUID]-Part-1/
    개인 페이지 & 공유된 페이지/
      [페이지명]/
        [페이지명].html
        image1.png
        image2.png
```

---

## 📝 Front Matter Template

Every post must start with YAML front matter:

```yaml
---
title: VESC 모터 회전 방향과 전류 설정 가이드
author: hyeongjoon-yang
date: 2026-01-30 11:00:00 +0900
categories: [Hardware, Manual]
tags: [VESC, motor-control, manual]
image:
  path: /assets/img/posts/vesc-general-tab/general-tab.png
---
```

### Required Fields
| Field | Description |
|-------|-------------|
| `title` | 블로그 스타일 제목 (따옴표 없이 작성 가능) |
| `author` | `_data/authors.yml`에 등록된 작성자 ID (반드시 물어볼 것) |
| `date` | `YYYY-MM-DD HH:MM:SS +0900` 형식 |
| `categories` | `[Category1, Category2]` 형식 |
| `tags` | `[tag1, tag2, tag3]` 형식 |

### Optional Fields
| Field | Description |
|-------|-------------|
| `image.path` | 대표 이미지 경로 (Notion HTML의 **첫 번째 이미지** 사용) |

### 대표 이미지 (Hero Image) 규칙

Notion HTML에서 **가장 처음에 나오는 이미지**를 front matter의 `image: path:`에 설정한다:

```yaml
image:
  path: /assets/img/posts/vesc-general-tab/general-tab.png
```

> ⚠️ `image.path`에는 `{{ site.baseurl }}`을 **붙이지 않는다**. Jekyll이 자동으로 처리한다.

### Common Categories
- `Hardware` - VESC, 모터, 센서 등 하드웨어 관련
- `Manual` - 설정 가이드, 튜토리얼
- `News` - 대회 결과, 이벤트, 공지사항

### Common Tags
- Hardware: `VESC`, `IMU`, `motor-control`, `hall-sensor`, `servo`
- Software: `ROS`, `ROS2`, `python`, `cpp`
- Type: `manual`, `getting-started`, `competition`
- Events: `f1tenth`, `iccas`, `icra`, `roboracer`

**Don't over-tag**: Use 3-5 relevant tags per post

---

## ✍️ Writing Style (어투 규칙)

### 문체 통일: `~했습니다`, `~됩니다` 체

모든 포스트의 어투를 **`~했습니다`**, **`~됩니다`** (합쇼체)로 통일한다.

### ❌ Wrong
```markdown
모터 회전 방향이 반대인 경우, 아래 3가지 방법으로 해결할 수 있다.
설정 후 반드시 Write Motor Configuration을 클릭해야 저장된다.
```

### ✅ Correct
```markdown
모터 회전 방향이 반대인 경우, 아래 3가지 방법으로 해결할 수 있습니다.
설정 후 반드시 Write Motor Configuration을 클릭해야 저장됩니다.
```

### 추가 규칙
- 문장 끝: `~합니다`, `~됩니다`, `~했습니다`, `~있습니다`
- 설명: `~입니다`, `~됩니다`
- 지시: `~하세요`, `~해주세요` 또는 `~합니다` 체로 서술

### 마무리 섹션 (필수)

모든 포스트의 **마지막**에 반드시 `## 마무리` 섹션을 넣는다. 이 섹션에서는:
- 글에서 다룬 내용을 간단히 요약한다
- 주의사항이나 핵심 포인트를 다시 강조한다
- 관련 포스트나 다음 단계로의 안내를 포함할 수 있다

Notion HTML에 마무리 섹션이 없으면 **직접 만들어서 추가**한다.

```markdown
## 마무리

이 글에서는 VESC의 Motor Settings - General 탭에서 모터 회전 방향과 전류 한도를 설정하는 방법을 다뤘습니다.
설정 변경 후에는 반드시 **Write Motor Configuration**을 클릭하여 저장하는 것을 잊지 마세요.

다음 단계로 [FOC 설정 가이드]({{ site.baseurl }}/posts/vesc-foc-tab/)를 참고하세요.
```

---

## 🔗 Link Rules

### 내부 포스트 링크 — `{{ site.baseurl }}` 필수

다른 포스트로의 링크에는 반드시 `{{ site.baseurl }}`을 붙인다:

```markdown
<!-- ✅ Correct -->
[펌웨어 업그레이드]({{ site.baseurl }}/posts/vesc-firmware-upgrade/)
[FOC 설정 가이드]({{ site.baseurl }}/posts/vesc-foc-tab/)

<!-- ❌ Wrong -->
[펌웨어 업그레이드](/posts/vesc-firmware-upgrade/)
```

### 이미지 경로 — `{{ site.baseurl }}` 불필요

이미지 경로에는 `{{ site.baseurl }}`을 **붙이지 않는다**:

```markdown
<!-- ✅ Correct -->
![General Tab](/assets/img/posts/vesc-general-tab/general-tab.png)

<!-- ❌ Wrong (불필요한 baseurl) -->
![General Tab]({{ site.baseurl }}/assets/img/posts/vesc-general-tab/general-tab.png)
```

### 외부 링크 — `[URL](URL)` 형식

외부 URL은 클릭 가능하도록 `[URL](URL)` 형식으로 작성한다:

```markdown
<!-- ✅ Correct -->
[https://github.com/vedderb/vesc_fw_archive/blob/main/6.05/60_MK6/VESC_default.bin](https://github.com/vedderb/vesc_fw_archive/blob/main/6.05/60_MK6/VESC_default.bin)

<!-- ❌ Wrong (클릭 불가) -->
https://github.com/vedderb/vesc_fw_archive/blob/main/6.05/60_MK6/VESC_default.bin
```

짧은 외부 링크는 설명 텍스트를 사용해도 된다:
```markdown
[VESC Tool 공식 사이트](https://vesc-project.com/vesc_tool)
```

---

## 🎨 Chirpy Theme: Prompt Blocks

Chirpy 테마에서는 특별한 강조 블록을 사용할 수 있다. Notion의 callout 블록을 이것으로 변환한다.

### 사용법
```markdown
> 주의사항 내용
{: .prompt-warning }

> 참고 정보
{: .prompt-info }

> 위험 경고
{: .prompt-danger }

> 팁 또는 추천
{: .prompt-tip }
```

### 변환 가이드

| Notion Callout | Chirpy Prompt |
|----------------|---------------|
| ⚠️ 경고, 주의 | `{: .prompt-warning }` |
| ℹ️ 정보, 참고 | `{: .prompt-info }` |
| 🔴 위험, 치명적 | `{: .prompt-danger }` |
| 💡 팁, 추천 | `{: .prompt-tip }` |

### 실제 예시
```markdown
> 모든 Motor Settings 변경 후, 우측 메뉴바의 **Write Motor Configuration**을 반드시 클릭해야 저장됩니다.
{: .prompt-warning }

> 반드시 **VESC 스펙**과 **모터 스펙**을 사전에 확인한 뒤 설정해야 합니다.
{: .prompt-info }

> Voltage, RPM, Advanced 등 나머지 설정은 전문적인 지식 없이 변경하면 치명적일 수 있습니다.
{: .prompt-danger }
```

---

## 📁 _data/wiki/ Integration

새 매뉴얼 포스트를 만들면 Getting Started 페이지에 등록할 수 있다.

### `_data/wiki/getting-started.yml` 구조
```yaml
- section: "hardware"
  title: "Hardware Setup"
  icon: "fas fa-microchip"
  steps:
    - step: 1
      title: "VESC Tool 다운로드"
      url: "/posts/vesc-tools-download/"
      description: "VESC Tool 설치 및 VESC 연결 방법"
```

### 새 포스트 등록 방법
1. `_data/wiki/getting-started.yml`에서 해당 section을 찾는다
2. 새 step을 추가한다 (step 번호 순서 맞추기)
3. `url`은 `/posts/[post-slug]/` 형식으로 작성한다

---

## 🖼️ Image Handling

### Step-by-Step Process

#### 1. Copy Images from Notion Export
```bash
# Source: ~/Downloads/[UUID]_ExportBlock-.../개인 페이지 & 공유된 페이지/[페이지명]/
# Destination: /home/js/unicorn-racing/assets/img/posts/[post-slug]/
```

#### 2. Rename Images
- **Remove spaces**: `image 1.png` → `image-1.png`
- **Use lowercase**: `Image_1.PNG` → `image-1.png`
- **Remove special characters**: Keep only alphanumeric, hyphens, and underscores

#### 3. Set Hero Image
Notion HTML에서 가장 먼저 나오는 이미지를 front matter에 등록:
```yaml
image:
  path: /assets/img/posts/[post-slug]/first-image.png
```

#### 4. Use Images in Content
```markdown
![설명 텍스트](/assets/img/posts/post-slug/image-1.png)
```
> ⚠️ 이미지 경로에는 `{{ site.baseurl }}`을 붙이지 않는다.

#### 5. Verify Filenames Match Markdown
파일명이 markdown 참조와 정확히 일치하는지 확인한다.

#### 6. Common Image Issues

| Issue | Problem | Solution |
|-------|---------|----------|
| Spaces in filename | `image 1.png` vs `image-1.png` | Rename file to use hyphens |
| Case mismatch | `Image.PNG` vs `image.png` | Use consistent lowercase |
| Wrong path | `/assets/image.png` | Use `/assets/img/posts/[slug]/` |

---

## 📋 Conversion Checklist

Before finalizing a converted post, verify:

- [ ] **작성자 확인**: author를 사용자에게 물어봤는가?
- [ ] **제목 추천**: 블로그 스타일 제목을 추천하고 승인받았는가?
- [ ] **Filename**: `YYYY-MM-DD-title.md` format
- [ ] **Front matter**: title, author, date, categories, tags, image 포함
- [ ] **대표 이미지**: 첫 번째 이미지를 `image: path:`에 설정
- [ ] **어투 통일**: `~했습니다`, `~됩니다` 체로 작성
- [ ] **내부 포스트 링크**: `{{ site.baseurl }}/posts/slug/` 형식 사용
- [ ] **이미지 경로**: `{{ site.baseurl }}` 없이 `/assets/img/posts/slug/...`
- [ ] **외부 URL**: `[URL](URL)` 형식으로 클릭 가능하게
- [ ] **Images copied**: Notion export → `assets/img/posts/[post-slug]/`
- [ ] **Image names**: No spaces, use hyphens, lowercase
- [ ] **마무리 섹션**: 글 마지막에 `## 마무리`가 있는가? 없으면 직접 작성
- [ ] **Chirpy prompts**: Notion callout → `{: .prompt-warning }` 등으로 변환
- [ ] **Code blocks**: Use proper markdown syntax with language specifiers
- [ ] **Tables**: Convert to markdown table format

---

## 🎨 Content Formatting

### Headers
```markdown
## H2 - Main sections
### H3 - Subsections
#### H4 - Minor subsections
```
> ⚠️ H1(`#`)은 사용하지 않는다. Chirpy 테마가 title을 자동으로 H1으로 렌더링한다.

### Code Blocks
````markdown
```python
def example():
    return "Use language specifier"
```
````

### Tables
```markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Row 1    | Data     | More     |
| Row 2    | Data     | More     |
```

### Emphasis
```markdown
**Bold text**
*Italic text*
`inline code`
```

---

## 🔍 Common Notion Export Issues

### Issue 1: Notion Page Database Tables
**Problem**: Notion databases export as HTML tables with internal links.

**Solution**:
- Convert table to list of posts
- Each row becomes a separate Jekyll post
- Extract metadata (dates, results) from table columns

### Issue 2: Notion Callout Blocks
**Problem**: Notion callouts are custom HTML.

**Solution**: Convert to Chirpy prompt blocks:
```markdown
> 내용
{: .prompt-warning }
```

### Issue 3: Nested Lists
**Problem**: Notion exports complex nested lists.

**Solution**: Preserve indentation with spaces (2 or 4 spaces per level)
```markdown
- Level 1
  - Level 2
    - Level 3
```

### Issue 4: Image Captions
**Problem**: Notion image captions are in separate HTML elements.

**Solution**: Add as markdown image alt text or caption below
```markdown
![Caption text](/assets/img/posts/post-slug/image.png)
*Figure 1: Caption text*
```

### Issue 5: Notion Styles and CSS
**Problem**: Notion HTML contains extensive `<style>` tags and CSS classes.

**Solution**: 모든 `<style>` 태그와 Notion 전용 CSS 클래스를 제거하고 순수 markdown으로 변환한다.

---

## 🛠️ Troubleshooting

### Build Errors
1. **"Liquid Exception: No such file or directory"**
   - Check all `{% link %}` tags point to existing files
   - Verify file paths are correct

2. **"404 on image"**
   - Check image file exists at specified path
   - Verify filename matches (no typos, correct extension)
   - 이미지 경로에 `{{ site.baseurl }}`이 잘못 들어간 건 아닌지 확인

3. **"Page build failed"**
   - Check YAML front matter is valid (proper indentation)
   - Verify no smart quotes or special characters in YAML
   - Check for unclosed code blocks

### Image Not Showing
1. Check filename: `image-1.png` vs `image 1.png`
2. Check path: `/assets/img/posts/[slug]/image.png`
3. Check file exists: `ls -la /home/js/unicorn-racing/assets/img/posts/[post-slug]/`
4. Check permissions: files should be readable

---

## ✅ Example: Complete Conversion

### Input: Notion HTML
```html
<style>... (Notion CSS) ...</style>
<article>
  <h1>General Tab (Motor Settings)</h1>
  <figure><img src="general-tab.png"/></figure>
  <p>Motor Settings의 General 탭에서는 모터의 회전 방향과 전류 한도를 설정할 수 있다.</p>
  <div class="callout">모든 설정 변경 후 Write Motor Configuration을 클릭해야 저장된다.</div>
  <p>자세한 내용은 <a href="https://github.com/vedderb/vesc_fw_archive">VESC firmware archive</a>를 참고한다.</p>
</article>
```

### Step 1: 사용자에게 질문
```
작성자(author)는 누구인가요?
→ "hyeongjoon-yang"

제목을 "VESC 모터 회전 방향과 전류 설정 가이드"로 추천합니다. 글도 블로그 스타일로 다듬을까요?
→ "네"
```

### Step 2: Output — Jekyll Markdown
```markdown
---
title: VESC 모터 회전 방향과 전류 설정 가이드
author: hyeongjoon-yang
date: 2026-01-30 11:00:00 +0900
categories: [Hardware, Manual]
tags: [VESC, motor-control, manual]
image:
  path: /assets/img/posts/vesc-general-tab/general-tab.png
---

VESC의 **Motor Settings - General** 탭에서는 모터의 회전 방향과 전류 한도를 설정할 수 있습니다. 차량 성능과 안전에 직접적으로 영향을 미치는 핵심 설정입니다.

> 모든 Motor Settings 변경 후, 우측 메뉴바의 **Write Motor Configuration**을 반드시 클릭해야 저장됩니다.
{: .prompt-warning }

![General Tab](/assets/img/posts/vesc-general-tab/general-tab.png)

자세한 내용은 [https://github.com/vedderb/vesc_fw_archive](https://github.com/vedderb/vesc_fw_archive)를 참고하세요.
```

### Files Created
1. `/home/js/unicorn-racing/_posts/2026-01-30-vesc-general-tab.md`
2. `/home/js/unicorn-racing/assets/img/posts/vesc-general-tab/general-tab.png`

---

## 📞 Questions?

If you encounter edge cases not covered in this guide:
1. Check existing posts for examples (especially `_posts/2026-01-30-vesc-*.md`)
2. Refer to Jekyll documentation: [https://jekyllrb.com/docs/](https://jekyllrb.com/docs/)
3. Refer to Chirpy theme documentation: [https://chirpy.cotes.page/](https://chirpy.cotes.page/)
4. Ask the team for clarification

---

**Last Updated**: 2026-01-31
**Maintained by**: UNICORN Racing Team
