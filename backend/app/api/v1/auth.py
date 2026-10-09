"""
Campus Recover — Authentication API Routes
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.config import settings
from app.api.deps import get_db, get_current_user, require_admin
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, Token
from app.schemas.user import UserResponse
from app.schemas.common import ApiResponse
from app.services.auth_service import auth_service
from app.auth.jwt_handler import create_access_token
from app.middleware.rate_limit import rate_limit

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=ApiResponse[Token],
    status_code=status.HTTP_201_CREATED,
    summary="Register a new student or staff account",
    dependencies=[Depends(rate_limit(settings.rate_limit_register_per_minute, 60, "register"))],
)
def register(
    register_data: UserRegister,
    db: Session = Depends(get_db),
):
    """
    Register a new user with an institutional email domain.
    Automatically generates a JWT token and returns user profile.
    """
    user = auth_service.register_user(db=db, register_data=register_data)

    token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value,
        }
    )

    token_response = Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )

    return ApiResponse(
        success=True,
        data=token_response,
        message="Registration successful. Welcome to Campus Recover!",
    )


@router.post(
    "/login",
    response_model=ApiResponse[Token],
    summary="Login with institutional email and password",
    dependencies=[Depends(rate_limit(settings.rate_limit_login_per_minute, 60, "login"))],
)
def login(
    login_data: UserLogin,
    db: Session = Depends(get_db),
):
    """
    Authenticate user credentials and issue signed JWT access token.
    """
    login_result = auth_service.login_user(db=db, login_data=login_data)

    token_response = Token(
        access_token=login_result["access_token"],
        token_type=login_result["token_type"],
        user=UserResponse.model_validate(login_result["user"]),
    )

    return ApiResponse(
        success=True,
        data=token_response,
        message="Login successful.",
    )


@router.get(
    "/me",
    response_model=ApiResponse[UserResponse],
    summary="Get current authenticated user profile",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve profile details for the currently authenticated user.
    """
    return ApiResponse(
        success=True,
        data=UserResponse.model_validate(current_user),
    )


@router.post(
    "/logout",
    response_model=ApiResponse[dict],
    summary="Logout session",
)
def logout(
    current_user: User = Depends(get_current_user),
):
    """
    Client-side token invalidation confirmation.
    """
    return ApiResponse(
        success=True,
        data={"user_id": str(current_user.id)},
        message="Successfully logged out.",
    )


@router.get(
    "/admin-check",
    response_model=ApiResponse[dict],
    summary="Verify administrator privileges (Role Guard Check)",
)
def admin_check(
    admin_user: User = Depends(require_admin),
):
    """
    Protected endpoint accessible exclusively by users with ADMIN role.
    """
    return ApiResponse(
        success=True,
        data={
            "admin_id": str(admin_user.id),
            "email": admin_user.email,
            "role": admin_user.role.value,
        },
        message="Administrator authorization confirmed.",
    )
