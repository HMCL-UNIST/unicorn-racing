---
title: VESC Tool 기본 사용법
author: jeongsang-ryu
date: 2026-01-04 22:05:27 +0900
categories: [build, beginner]
tags: [vesc, vesc-tools]
image:
  path: /assets/img/posts/vesc-tool-basic-usage/image.png
lang: ko
lang_ref: vesc-tool-basic-usage
---

이번 글에서는 VESC Tool을 사용할 때 알아두면 좋은 기본 기능과 주의사항을 정리했습니다.

## VESC(하드웨어)와 VESC Tool 연결하기

![VESC Tool 연결 화면](/assets/img/posts/vesc-tool-basic-usage/image-1.png)

처음 연결하면 위와 같은 초기 화면이 나타납니다.

## 권한 문제 해결 방법

`Connect` 버튼을 눌렀을 때 권한 문제가 발생하면 아래 명령어로 포트 권한을 부여하면 됩니다.

```bash
# 포트는 자신의 포트 번호에 맞게 변경하세요.
# 666은 읽기 및 쓰기 권한을 주는 것(모터 상태 읽기/제어 명령에 필요)
sudo chmod 666 /dev/ttyACM0
```

- VESC ROS driver에서도 동일한 권한 문제가 발생하면 같은 방식으로 해결할 수 있습니다.
- USB 기반 다른 장치에서 권한 문제가 발생해도 동일하게 적용 가능합니다.
- VESC Tool과 VESC ROS driver는 동시에 연결할 수 없습니다.

> 컴퓨터에서 VESC 포트의 Manufacturer 정보를 읽어 자동으로 권한을 부여하는 방법도 있습니다. 자세한 내용은 [참고자료](https://github.com/HMCL-UNIST/unicorn-racing-stack/blob/main/INSTALLATION.md#udev-rules-setup)를 확인하세요.

## VESC Tool 기본 사용법

![VESC Tool 오른쪽 탭](/assets/img/posts/vesc-tool-basic-usage/right-tab.png)

VESC Tool 오른쪽 탭에는 다음과 같은 버튼이 있습니다.

1. **Reconnect last connect**
   - Main 페이지에서 Connect 하는 것과 거의 같은 기능입니다.
   - 여러 개의 VESC를 하나의 VESC Tool에 연결할 때, 최근 연결된 기기가 자동으로 연결됩니다.
2. **Disconnect**
   - VESC와 VESC Tool의 연결을 끊습니다.
3. **Read Motor Configuration**
   - 왼쪽 Motor Settings 탭 관련 설정을 VESC → VESC Tool로 읽어옵니다.
4. **Read Default Motor Configuration**
   - 모터 설정을 초기 상태로 되돌립니다.
5. **Write Motor Configuration**
   - 왼쪽 Motor Settings 탭 관련 설정을 VESC Tool → VESC로 적용합니다.
6. **Read App Configuration**
   - 왼쪽 App Settings 탭 관련 설정을 VESC → VESC Tool로 읽어옵니다.
7. **Read Default App Configuration**
   - App 설정을 초기 상태로 되돌립니다.
8. **Write App Configuration**
   - 왼쪽 App Settings 탭 관련 설정을 VESC Tool → VESC로 적용합니다.

### 중요한 주의사항

- VESC Tool에서 변경한 파라미터는 `Write`를 누르기 전까지 적용되지 않습니다.
- VESC를 연결한 뒤, 기존 설정을 확인하지 않고 `Write`를 누르면 이전 설정이 덮어씌워질 수 있습니다.
- 반드시 `Read`로 현재 설정을 확인한 후에 `Write`를 진행하는 것이 안전합니다.
- 설정을 파일로 저장하는 기능도 제공됩니다.
- Motor Settings에서는 모터 관련 값을, App Settings에서는 Servo 출력 및 IMU 관련 설정을 조정합니다.

## 마무리

VESC Tool은 `Read`와 `Write` 흐름만 정확히 이해하면 안정적으로 사용할 수 있습니다. 특히 연결 직후에는 반드시 현재 설정을 `Read`로 확인한 뒤 변경 사항을 적용해야 합니다. 권한 문제가 발생하면 포트 권한을 먼저 해결하고, 필요하면 udev 규칙 설정도 고려해 보시기 바랍니다.
