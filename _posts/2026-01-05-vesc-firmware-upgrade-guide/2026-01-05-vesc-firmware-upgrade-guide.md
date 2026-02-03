---
title: "VESC 펌웨어 업그레이드 가이드: 6.05 추천과 2가지 방법"
author: hyeongjoon-yang
date: 2026-01-05 22:25:44 +0900
categories: [build, beginner]
tags: [vesc, vesc-tools]
image:
  path: /assets/img/posts/vesc-firmware-upgrade-guide/image.png
lang: ko
lang_ref: vesc-firmware-upgrade-guide
---

VESC를 사용하기 전에 펌웨어 업그레이드는 선택이 아니라 필수입니다. 이 글은 **VESC MK6 / MK6 HP 기준**으로, 안정적인 6.05 버전을 추천하는 이유와 업그레이드 방법 2가지를 정리했습니다.

## 펌웨어 버전 선택: 왜 6.05인가?

- 최신 펌웨어에서 센서 인식 문제나 일부 기능 오류가 보고된 사례가 있습니다.
- 대회용 차량이나 장시간 운용 환경에서는 검증된 안정성이 더 중요합니다.
- 사용자 커뮤니티에서도 6.05 버전 사용 사례가 가장 많습니다.

### 펌웨어 파일 선택

반드시 **사용 중인 VESC 하드웨어 버전**에 맞는 펌웨어 파일을 선택해야 합니다.

#### VESC MK6 / MK6 HP 권장 파일

- MK6: [https://github.com/vedderb/vesc_fw_archive/blob/main/6.05/60_MK6/VESC_default.bin](https://github.com/vedderb/vesc_fw_archive/blob/main/6.05/60_MK6/VESC_default.bin)
- MK6 HP: [https://github.com/vedderb/vesc_fw_archive/blob/main/6.05/60_MK6_HP/VESC_default.bin](https://github.com/vedderb/vesc_fw_archive/blob/main/6.05/60_MK6_HP/VESC_default.bin)

#### 비권장 파일

- `VESC_default_no_hw_limits.bin`은 하드웨어 보호 제한이 비활성화되어 있어 일반 사용자에게는 권장하지 않습니다.

---

## 방법 1. 펌웨어 파일을 직접 다운로드해 업로드하기

VESC 공식 펌웨어 아카이브는 아래 GitHub 저장소에서 관리됩니다.

- [https://github.com/vedderb/vesc_fw_archive](https://github.com/vedderb/vesc_fw_archive)

업로드 절차는 다음과 같습니다.

1. 하드웨어에 맞는 `.bin` 파일을 다운로드합니다.
2. PC에서 VESC Tool을 실행한 뒤 VESC와 연결합니다.
3. 상단 메뉴에서 `Firmware` 탭을 선택합니다.
4. `Custom File` 옵션을 선택합니다.
5. 다운로드한 `.bin` 파일을 선택해 업로드합니다.
6. 업로드가 끝나면 VESC가 자동으로 재부팅됩니다.
7. 재부팅 후 다시 연결해 사용합니다.

![Firmware - Custom File 탭에서 펌웨어 업로드](/assets/img/posts/vesc-firmware-upgrade-guide/custom-file-upload.webp)

---

## 방법 2. VESC Tool의 Firmware Archive 기능 사용하기

PC가 인터넷에 연결된 상태라면 VESC Tool의 **Firmware Archive 기능**을 사용할 수 있습니다.


- VESC 하드웨어를 자동으로 인식해 호환 펌웨어를 매칭해 줍니다.
- 기본값은 최신 버전이므로 **Version을 수동으로 6.05로 변경**하는 것을 추천합니다.

![Firmware - Archive 탭에서 6.05 버전 선택](/assets/img/posts/vesc-firmware-upgrade-guide/archive-firmware-select.webp)

## 마무리

최신 펌웨어가 항상 가장 안정적인 것은 아닙니다. 특히 대회용 차량이나 연구용 플랫폼에서는 **검증된 6.05 버전이 합리적인 선택**이 됩니다. 업그레이드 후에는 모터 및 센서 설정이 초기화될 수 있으므로, 반드시 설정을 다시 확인하고 적용하시기 바랍니다.
