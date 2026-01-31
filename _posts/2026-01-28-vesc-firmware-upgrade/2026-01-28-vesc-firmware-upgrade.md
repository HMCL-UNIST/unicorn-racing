---
title: VESC Firmware Upgrade Guide (권장 버전 6.05)
author: hyeongjoon-yang
date: 2026-01-28 10:00:00 +0900
categories: [Hardware, Manual]
tags: [VESC, firmware, manual]
image:
   path: /assets/img/posts/vesc_mk6.png
  # alt: image alternative text
lang: ko
lang_ref: vesc-firmware-upgrade
---

VESC를 사용하다 보면 펌웨어 업데이트를 한 번쯤은 고민하게 된다.  
하지만 **항상 최신 펌웨어가 최선은 아니며**, 실제 사용자들 사이에서는  
**안정성 측면에서 6.05 버전을 여전히 권장**하는 분위기다.

이 글에서는 **VESC MK6 / MK6 HP 기준으로**,  
안정적인 펌웨어(6.05)를 직접 업로드하는 방법과  
VESC Tool의 Archive를 이용하는 방법을 정리한다.

---

## Firmware 다운로드 (GitHub Archive)

VESC 공식 펌웨어 아카이브는 아래 GitHub 저장소에서 관리되고 있다.

🔗 [https://github.com/vedderb/vesc_fw_archive](https://github.com/vedderb/vesc_fw_archive)

### ⚠️ 왜 6.05를 추천하는가?
- 최신 펌웨어는 센서 인식 문제나 일부 기능에서 **예기치 않은 오류**가 보고됨
- 대회용 차량이나 장시간 운용 환경에서는 **검증된 안정성**이 더 중요
- 실제 사용자 커뮤니티에서도 **6.05 버전 사용 사례가 가장 많음**

---

## 펌웨어 파일 선택

반드시 **본인이 사용하는 VESC 하드웨어 버전**에 맞는 펌웨어를 선택해야 한다.

### 🔹 VESC MK6 (HP)
- ✅ 권장  
  - `VESC_default.bin`  
  https://github.com/vedderb/vesc_fw_archive/blob/main/6.05/60_MK6/VESC_default.bin
  https://github.com/vedderb/vesc_fw_archive/blob/main/6.05/60_MK6_HP/VESC_default.bin
- ❌ 비권장  
  - `VESC_default_no_hw_limits.bin`  
  → 하드웨어 보호 제한이 비활성화되어 있어 사용자들 사이에서 추천되지 않음

---

## VESC Tool을 이용한 펌웨어 업로드

1. PC에서 **VESC Tool 실행 후 VESC와 연결**
2. 상단 메뉴에서 **Firmware 탭** 선택
3. **Custom File** 옵션 선택
4. 다운로드한 `.bin` 파일을 선택 후 업로드
5. 업로드 완료 후 VESC가 **자동 재부팅**
6. 재부팅 이후 다시 연결하여 사용

![VESC Tool Firmware Tab](/assets/img/posts/vesc-firmware-upgrade/firmware-tab.png)
![Firmware Upload Icon](/assets/img/posts/vesc-firmware-upgrade/firmware-upload-icon.png)

---

## Archive 기능 사용 (인터넷 연결 가능 시)

PC가 인터넷에 연결된 상태라면  
VESC Tool에서 제공하는 **Firmware Archive 기능**을 사용할 수도 있다.

![VESC Tool Archive](/assets/img/posts/vesc-firmware-upgrade/firmware-archive.png)

- VESC 하드웨어를 자동으로 인식하여 **호환 펌웨어 매칭**
- 기본적으로 최신 버전이 선택되므로  
  👉 **Version을 수동으로 6.05로 변경하는 것을 추천**

---

## 마무리

- 최신 펌웨어 ≠ 가장 안정적인 펌웨어
- 특히 대회용 차량이나 연구용 플랫폼에서는  
  **검증된 6.05 버전이 여전히 합리적인 선택**
- 펌웨어 업로드 후에는 반드시 **모터/센서 설정 재확인** 권장