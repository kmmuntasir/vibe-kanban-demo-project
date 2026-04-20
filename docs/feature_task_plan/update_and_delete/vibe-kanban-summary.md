# Vibe Kanban — Update & Delete Feature Summary

## IDs

| Resource | ID |
|----------|-----|
| Org | `5531a49b-c920-46ab-9898-296eb2f4f543` |
| Project | `fd2054e2-7b8a-4190-8a54-da5a51bfdaf6` ("vibe-kanban-demo") |
| Repo | `98bd1728-f690-4960-a548-9fe1f8d1b7a7` ("vibe-kanban-demo-project") |

## Task IDs

| # | Title | Issue ID | Batch |
|---|-------|----------|-------|
| T1 | Add UPDATE_COLUMNS and UPDATE_VALIDATION_RULES to UserModel | `62f94af8-38c0-4c98-b39f-f62219d91d52` | 1 |
| T2 | Add findById, update, remove to UserRepository | `d201a67f-e51a-4d19-803d-1e00367d04ea` | 1 |
| T3 | Repository Tests — findById, update, remove | `f26d11d4-7e6a-42af-900a-0516d6c45ad1` | 1 |
| T4 | Add updateUser, deleteUser to UserService | `d1f13b8e-9408-42ff-be80-06e4cf8bfe8e` | 2 |
| T5 | Service Tests — updateUser, deleteUser | `13347d81-39ce-4a4d-b265-cc277d94d067` | 2 |
| T6 | Add updateUser, deleteUser Controllers | `9dca598f-5fae-4824-b887-295176558bc0` | 2 |
| T7 | Wire PUT and DELETE Routes | `c43d5f46-ca70-4249-8741-07c983ddc6d4` | 3 |
| T8 | Controller Integration Tests — PUT and DELETE | `23d0d433-fd1f-41c1-9d6b-177a33cbc549` | 3 |
| T9 | Frontend — Edit and Delete UI | `815f16e0-e06d-4124-adfe-2e93253770bc` | 3 |

## Parallelization Batches

```
Batch 1 (Foundation):  T1 → T2 → T3  (merge before Batch 2)
Batch 2 (Logic):       T4 + T6 parallel, then T5  (merge before Batch 3)
Batch 3 (Wiring + UI): T7 first, then T8 + T9 parallel
```

## Dependencies

```
T1 ──→ T2 ──→ T3
 │      └───→ T4 ──→ T5
 │             └───→ T6 ──→ T7 ──→ T8
 └────────────────────────→ T7 ──→ T9
```

9 tasks, 10 dependency links.
